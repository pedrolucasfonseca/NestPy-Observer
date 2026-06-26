import express from 'express';
import fs from 'fs';
import path from 'path';
import { PaymentsFactory } from './payments/payments.factory.js';

const app = express();
app.use(express.json()); // allows the API to parse json requests

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
    fs.appendFileSync('/app/app.log', logLine);
};

// POST route to process payments
app.post('/payments', (req, res) => {
    const { type, amount } = req.body;
    if (!type || !amount) {
        writeLog('WARN', 'Request attempted with missing fields');
        return res.status(400).json({ error: '"type" and "amount" fields are required.' });
    }

    try { // factory creates the correct strategy
        const strategy = PaymentsFactory.createStrategy(type);

        // strategy processes the payment
        const result = strategy.process(Number(amount));

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

// Health check route
app.get('/status', (_req, res) => {
    return res.json({ status: 'API is running.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
