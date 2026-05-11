import Decimal from 'decimal.js';

// Use banker's rounding (round half to even). decimal.js exposes
// ROUND_HALF_EVEN exactly for this.
Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN, precision: 40 });

/** Banker's rounding to a fixed number of decimals. */
export function bankersRound(value: number | string, decimals = 2): number {
  return new Decimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_EVEN).toNumber();
}

/** Decimal-safe multiply, then bankers-round to 2dp. */
export function priceOf(qty: number, unitPrice: number): number {
  return new Decimal(qty)
    .mul(unitPrice)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN)
    .toNumber();
}

export { Decimal };
