import Decimal from 'decimal.js';

// Banker's rounding (half-to-even) to 2 decimals
export function bankersRound2(value: Decimal | number | string): number {
  const d = new Decimal(value);
  // decimal.js: ROUND_HALF_EVEN = 6
  return Number(d.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN).toString());
}

export function priceWithTier(basePrice: number, multiplier: number): number {
  return bankersRound2(new Decimal(basePrice).mul(multiplier));
}

export function money(value: Decimal | number | string): number {
  return bankersRound2(value);
}
