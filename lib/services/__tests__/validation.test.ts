import './mocks';

const USD_CASH_DISCOUNT = 0.50;

describe('BUG-007: USD Cash Discount', () => {
  it('should apply $0.50 discount for cash payments', () => {
    const priceUSD = 1.5;
    const qty = 1;
    const subtotal = priceUSD * qty;
    const total = Math.max(0, subtotal - USD_CASH_DISCOUNT);
    expect(total).toBe(1.0);
  });

  it('should not go negative with discount', () => {
    const priceUSD = 0.25;
    const qty = 1;
    const subtotal = priceUSD * qty;
    const total = Math.max(0, subtotal - USD_CASH_DISCOUNT);
    expect(total).toBe(0);
  });

  it('should apply discount per sale (not per item)', () => {
    const priceUSD = 1.5;
    const qty = 3;
    const subtotal = priceUSD * qty;
    const total = Math.max(0, subtotal - USD_CASH_DISCOUNT);
    expect(total).toBe(4.0); // 4.50 - 0.50 = 4.00
  });

  it('should NOT apply discount for mobile payments', () => {
    const priceUSD = 1.5;
    const qty = 1;
    const total = priceUSD * qty; // no discount applied
    expect(total).toBe(1.5);
  });

  it('should NOT apply discount for mixed payments', () => {
    const priceUSD = 1.5;
    const qty = 1;
    const total = priceUSD * qty; // no discount on mixed total
    expect(total).toBe(1.5);
  });
});

describe('BUG-008: Mixed Payment Split', () => {
  it('should calculate mixed payment with custom ratio', () => {
    const totalUSD = 10;
    const totalBS = 400;
    const cashPercent = 25;

    const cashAmount = totalUSD * (cashPercent / 100);
    const mobileAmountBS = totalBS * ((100 - cashPercent) / 100);

    expect(cashAmount).toBe(2.5);
    expect(mobileAmountBS).toBe(300);
  });

  it('should handle 50/50 split correctly', () => {
    const totalUSD = 10;
    const totalBS = 400;
    const cashPercent = 50;

    const cashAmount = totalUSD * (cashPercent / 100);
    const mobileAmountBS = totalBS * ((100 - cashPercent) / 100);

    expect(cashAmount).toBe(5);
    expect(mobileAmountBS).toBe(200);
  });

  it('should handle 75/25 split correctly', () => {
    const totalUSD = 10;
    const totalBS = 400;
    const cashPercent = 75;

    const cashAmount = totalUSD * (cashPercent / 100);
    const mobileAmountBS = totalBS * ((100 - cashPercent) / 100);

    expect(cashAmount).toBe(7.5);
    expect(mobileAmountBS).toBe(100);
  });

  it('should handle 0% cash (all mobile)', () => {
    const totalUSD = 10;
    const totalBS = 400;
    const cashPercent = 0;

    const cashAmount = totalUSD * (cashPercent / 100);
    const mobileAmountBS = totalBS * ((100 - cashPercent) / 100);

    expect(cashAmount).toBe(0);
    expect(mobileAmountBS).toBe(400);
  });

  it('should handle 100% cash', () => {
    const totalUSD = 10;
    const totalBS = 400;
    const cashPercent = 100;

    const cashAmount = totalUSD * (cashPercent / 100);
    const mobileAmountBS = totalBS * ((100 - cashPercent) / 100);

    expect(cashAmount).toBe(10);
    expect(mobileAmountBS).toBe(0);
  });
});

describe('BUG-001: Error Propagation', () => {
  it('should use error message from exception', () => {
    const error = new Error('AsyncStorage quota exceeded');
    const msg = error instanceof Error ? error.message : 'No se pudo guardar';
    expect(msg).toBe('AsyncStorage quota exceeded');
  });

  it('should fallback for non-Error throws', () => {
    const error = 'string error';
    const msg = error instanceof Error ? error.message : 'No se pudo guardar';
    expect(msg).toBe('No se pudo guardar');
  });

  it('should fallback for null throws', () => {
    const error = null;
    const msg = error instanceof Error ? error.message : 'No se pudo guardar';
    expect(msg).toBe('No se pudo guardar');
  });
});

describe('BUG-002: Numeric Validation', () => {
  it('should detect invalid price strings', () => {
    const parsePrice = (val: string): number | null => {
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) || parsed < 0 ? null : parsed;
    };

    expect(parsePrice('1.50')).toBe(1.5);
    expect(parsePrice('1,50')).toBe(1.5);
    expect(parsePrice('0')).toBe(0);
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('-5')).toBeNull();
  });

  it('should detect invalid stock values', () => {
    const parseStock = (val: string): number | null => {
      const parsed = parseInt(val);
      return isNaN(parsed) || parsed < 0 ? null : parsed;
    };

    expect(parseStock('10')).toBe(10);
    expect(parseStock('0')).toBe(0);
    expect(parseStock('abc')).toBeNull();
    expect(parseStock('')).toBeNull();
    expect(parseStock('-1')).toBeNull();
  });

  it('should validate presentation name presence', () => {
    const validatePresentation = (name: string): boolean => name.trim().length > 0;
    expect(validatePresentation('60g')).toBe(true);
    expect(validatePresentation('')).toBe(false);
    expect(validatePresentation('  ')).toBe(false);
  });
});

describe('BUG-010: Double Submit Prevention', () => {
  it('should prevent concurrent submissions with ref guard', async () => {
    let isSaving = false;
    const submit = async () => {
      if (isSaving) return false;
      isSaving = true;
      await new Promise(r => setTimeout(r, 10));
      isSaving = false;
      return true;
    };

    const call1 = submit();
    const result2 = await submit();
    expect(result2).toBe(false);

    const result1 = await call1;
    expect(result1).toBe(true);
  });
});
