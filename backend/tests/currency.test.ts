import { describe, test, expect } from 'vitest';
import { CurrencyUtils } from '../src/utils/currency.js';

describe('CurrencyUtils Unit Tests', () => {
  test('should accurately convert Rupees to Paise', () => {
    expect(CurrencyUtils.toPaise(1499)).toBe(149900);
    expect(CurrencyUtils.toPaise(2499.50)).toBe(249950);
    expect(CurrencyUtils.toPaise(0)).toBe(0);
  });

  test('should accurately convert Paise to Rupees', () => {
    expect(CurrencyUtils.toRupees(149900)).toBe(1499);
    expect(CurrencyUtils.toRupees(249950)).toBe(2499.5);
  });

  test('should format INR currency strings correctly', () => {
    const formatted = CurrencyUtils.formatINR(2499);
    expect(formatted).toContain('2,499');
  });

  test('should calculate standard 18% GST correctly', () => {
    const gstIntra = CurrencyUtils.calculateGST(1000, false);
    expect(gstIntra.totalGst).toBe(180);
    expect(gstIntra.cgst).toBe(90);
    expect(gstIntra.sgst).toBe(90);
    expect(gstIntra.igst).toBe(0);

    const gstInter = CurrencyUtils.calculateGST(1000, true);
    expect(gstInter.totalGst).toBe(180);
    expect(gstInter.cgst).toBe(0);
    expect(gstInter.sgst).toBe(0);
    expect(gstInter.igst).toBe(180);
  });
});
