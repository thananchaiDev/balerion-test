const TEXT_COLLATOR = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
});

export function compareText(a: string, b: string) {
  return TEXT_COLLATOR.compare(a, b);
}

export function compareNumber(a: number, b: number) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
