import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PixPayment, CreditPayment } from './strategy.interface.js';

test('PixPayment approves amounts up to the R$1500 limit', () => {
    const result = new PixPayment().process(1500);
    assert.equal(result.success, true);
    assert.match(result.message, /processed instantly/);
});

test('PixPayment rejects amounts above the R$1500 limit', () => {
    const result = new PixPayment().process(1500.01);
    assert.equal(result.success, false);
    assert.match(result.message, /exceeds the limit/);
});

test('CreditPayment approves amounts up to the R$5000 limit', () => {
    const result = new CreditPayment().process(5000);
    assert.equal(result.success, true);
    assert.match(result.message, /approved/);
});

test('CreditPayment rejects amounts above the R$5000 limit', () => {
    const result = new CreditPayment().process(5000.01);
    assert.equal(result.success, false);
    assert.match(result.message, /declined/);
});
