import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { writeLog } from './logger.js';

test('writes a JSON log line with level, message and timestamp', () => {
    const logPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nestpy-observer-')), 'app.log');

    writeLog('INFO', 'test message', logPath);

    const line = fs.readFileSync(logPath, 'utf-8').trim();
    const entry = JSON.parse(line);

    assert.equal(entry.level, 'INFO');
    assert.equal(entry.message, 'test message');
    assert.ok(!Number.isNaN(Date.parse(entry.timestamp)));
});

test('appends multiple entries as separate lines', () => {
    const logPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'nestpy-observer-')), 'app.log');

    writeLog('WARN', 'first', logPath);
    writeLog('ERROR', 'second', logPath);

    const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
    assert.equal(lines.length, 2);
});
