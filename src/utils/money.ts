/**
 * Money helpers. All arithmetic is done in integer cents so that assertions are
 * not affected by floating-point noise (e.g. 0.1 + 0.2 !== 0.3).
 */

/** Extracts the first currency amount from text such as "Item total: $39.98". */
export function parseMoney(text: string | null): number {
  const match = text?.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (!match) {
    throw new Error(`Could not find a $ amount in text: "${text}"`);
  }
  return Number(match[1]);
}

export const toCents = (amount: number): number => Math.round(amount * 100);

export const fromCents = (cents: number): number => cents / 100;

/** Sums prices exactly, returning dollars. */
export function sumPrices(prices: readonly number[]): number {
  return fromCents(prices.reduce((total, price) => total + toCents(price), 0));
}

/** Tax rounded half-up to the nearest cent, the way a till would show it. */
export function calculateTax(subtotal: number, rate: number): number {
  return fromCents(Math.round(toCents(subtotal) * rate));
}
