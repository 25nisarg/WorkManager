import type { CurrencyAmount } from "@/types/financial";

export function numberValue(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function addCurrencyAmount(
  totals: Map<string, number>,
  currency: string,
  amount: number | string
) {
  totals.set(currency, (totals.get(currency) ?? 0) + numberValue(amount));
}

export function currencyAmounts(totals: Map<string, number>): CurrencyAmount[] {
  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export function groupCurrencyAmounts<T>(
  rows: T[],
  currency: (row: T) => string,
  amount: (row: T) => number | string
) {
  const totals = new Map<string, number>();
  for (const row of rows) addCurrencyAmount(totals, currency(row), amount(row));
  return currencyAmounts(totals);
}

export function subtractCurrencyAmounts(
  minuend: CurrencyAmount[],
  subtrahend: CurrencyAmount[]
) {
  const totals = new Map(minuend.map((value) => [value.currency, value.amount]));
  for (const value of subtrahend) {
    totals.set(value.currency, (totals.get(value.currency) ?? 0) - value.amount);
  }
  return currencyAmounts(
    new Map([...totals].map(([currency, amount]) => [currency, Math.max(amount, 0)]))
  );
}
