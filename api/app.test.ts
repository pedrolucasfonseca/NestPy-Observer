import os from 'os';
import path from 'path';

// keeps the log writes made through the real routes inside a temp dir during tests
process.env['LOG_PATH'] = path.join(os.tmpdir(), 'nestpy-observer-tests', 'app.log');

import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from './app.js';
import { pool } from './db.js';

afterEach(() => {
    mock.restoreAll();
});

test('POST /payments approves a pix payment within the limit', async () => {
    const query = mock.method(pool, 'query', async () => ({ rows: [] }));

    const res = await request(app)
        .post('/payments')
        .send({ type: 'pix', amount: 500 });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(query.mock.callCount(), 1);
});

test('POST /payments rejects a pix payment above the limit with 422', async () => {
    mock.method(pool, 'query', async () => ({ rows: [] }));

    const res = await request(app)
        .post('/payments')
        .send({ type: 'pix', amount: 2000 });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
});

test('POST /payments returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/payments').send({ type: 'pix' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /required/);
});

test('POST /payments returns 400 for an unsupported payment type', async () => {
    const res = await request(app)
        .post('/payments')
        .send({ type: 'boleto', amount: 100 });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /not supported/);
});

test('GET /payments returns the transaction history from the database', async () => {
    const rows = [{ id: 1, type: 'pix', amount: '500.00', status: 'approved' }];
    mock.method(pool, 'query', async () => ({ rows }));

    const res = await request(app).get('/payments');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, rows);
});

test('GET /payments/:id returns 404 when the transaction does not exist', async () => {
    mock.method(pool, 'query', async () => ({ rows: [] }));

    const res = await request(app).get('/payments/999');

    assert.equal(res.status, 404);
});

test('GET /payments/:id returns the transaction when it exists', async () => {
    const row = { id: 1, type: 'card', amount: '1000.00', status: 'approved' };
    mock.method(pool, 'query', async () => ({ rows: [row] }));

    const res = await request(app).get('/payments/1');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, row);
});

test('GET /status reports the API is running', async () => {
    const res = await request(app).get('/status');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'API is running.');
});

test('GET /metrics exposes Prometheus-formatted metrics', async () => {
    const res = await request(app).get('/metrics');

    assert.equal(res.status, 200);
    assert.match(res.text, /payments_total/);
});

// documents a pre-existing edge case: `!amount` treats a numeric 0 as "missing",
// so a pix/card payment of exactly R$0 is rejected as a validation error (400)
// instead of being routed to the payment strategy.
test('POST /payments treats an amount of 0 as a missing field, not a valid payment', async () => {
    const query = mock.method(pool, 'query', async () => ({ rows: [] }));

    const res = await request(app)
        .post('/payments')
        .send({ type: 'pix', amount: 0 });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /required/);
    assert.equal(query.mock.callCount(), 0);
});
