import { compareText } from './compare';

export function uniqueSortedStrings(values: Iterable<string>) {
  return Array.from(new Set(values)).sort(compareText);
}
