import test from 'node:test';
import assert from 'node:assert/strict';
import { calcLineAmount, calcInvoiceTotals } from '../src/lib/invoiceCalc.ts';

test('invoice line calculation is deterministic', () => {
  assert.equal(calcLineAmount(2, 100000, 10000), 190000);
  assert.equal(calcLineAmount(2, 100000, 999999), 0);
});

test('invoice totals prorate invoice discount and tax per item', () => {
  const result = calcInvoiceTotals([
    { amount: 100000, taxRate: 11 },
    { amount: 50000, taxRate: 0 },
  ], { discountType: 'fixed', discountValue: 15000, additionalCharges: 0 });
  assert.equal(result.subtotal, 150000);
  assert.equal(result.discountAmount, 15000);
  assert.equal(result.taxableAmount, 135000);
  assert.equal(result.taxAmount, 9900);
  assert.equal(result.grandTotal, 144900);
});
