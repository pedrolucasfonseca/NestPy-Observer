import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentsFactory } from './payments.factory.js';
import { PixPayment, CreditPayment } from './strategy.interface.js';

test('creates a PixPayment strategy for type "pix"', () => {
    assert.ok(PaymentsFactory.createStrategy('pix') instanceof PixPayment);
});

test('creates a CreditPayment strategy for type "card"', () => {
    assert.ok(PaymentsFactory.createStrategy('card') instanceof CreditPayment);
});

test('is case-insensitive when matching the payment type', () => {
    assert.ok(PaymentsFactory.createStrategy('PIX') instanceof PixPayment);
    assert.ok(PaymentsFactory.createStrategy('Card') instanceof CreditPayment);
});

test('throws for an unsupported payment type', () => {
    assert.throws(
        () => PaymentsFactory.createStrategy('boleto'),
        /Payment method "boleto" is not supported\./
    );
});
