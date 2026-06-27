import express from 'express';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { PaymentsFactory } from './payments/payments.factory.js';
import client from 'prom-client';
import { pool, initDb } from './db.js';

const app = express();
app.use(express.json()); // allows the API to parse json requests

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
});
app.use(limiter);

// collects default Node.js metrics: memory, CPU, garbage collection, etc.
client.collectDefaultMetrics();

// counts total payments by type (pix/card) and status (approved/rejected)
const paymentsCounter = new client.Counter({
    name: 'payments_total',
    help: 'Total number of payments processsed',
    labelNames: ['type', 'status']
});

// tracks the distribution of payment amounts across buckets (in BRL)
const paymentsAmountHistogram = new client.Histogram({
    name: 'payments_amount',
    help: 'Distribution of payments amounts',
    labelNames: ['type'],
    buckets: [100, 500, 1000, 2000, 5000, 10000]
});

// help function to write logs as json lines
const writeLog = (level: 'INFO' | 'WARN' | 'ERROR', message: string) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message
    };
    // Serialize the object as a single json line
    const logLine = JSON.stringify(logEntry) + '\n';

    // Append to app.log
    fs.appendFileSync('/app/logs/app.log', logLine);
};

// POST route to process payments
app.post('/payments', async (req, res) => {
    const { type, amount } = req.body;
    if (!type || !amount) {
        writeLog('WARN', 'Request attempted with missing fields');
        return res.status(400).json({ error: '"type" and "amount" fields are required.' });
    }

    try { // factory creates the correct strategy
        const strategy = PaymentsFactory.createStrategy(type);

        // strategy processes the payment
        const result = strategy.process(Number(amount));

        // persist the transaction result in the database
        await pool.query(
            'INSERT INTO transactions (type, amount, status, message) VALUES ($1, $2, $3, $4)',
            [type, amount, result.success ? 'approved' : 'rejected', result.message]
        );

        // increment metrics
        paymentsCounter.inc({ type, status: result.success ? 'approved' : 'rejected' });
        paymentsAmountHistogram.observe({ type }, Number(amount));

        if (result.success) {
            writeLog('INFO', `Success: ${result.message}`);
            return res.status(200).json(result);
        } else {
            writeLog('WARN', `Denied: ${result.message}`);
            return res.status(422).json(result);
        }
    } catch (error: any) {
        // Likely an unsupported payment type in the factory
        writeLog('ERROR', `Critical error: ${error.message}`);
        return res.status(400).json({ error: error.message });
    }
});

// GET /payments to return full transaction history, newest first
app.get('/payments', async (_req, res) => {
    const result = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC');
    return res.json(result.rows);
})

// GET /payments/:id to return a single transaction by id
app.get('/payments/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [req.params['id']]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found.' });
    return res.json(result.rows[0]);
});

// exposes metrics in Prometheus format for scraping
app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
});

// Health check route
app.get('/status', (_req, res) => {
    return res.json({ status: 'API is running.' });
});

const PORT = process.env.PORT || 3000;
await initDb();
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
