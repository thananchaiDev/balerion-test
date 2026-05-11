// Deterministic random helpers used by the synthetic data generator.

export type Weighted<T> = { value: T; weight: number };

/** Mulberry32 PRNG — deterministic, seeded uniform [0, 1). */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Weighted pick from a non-empty list. */
export function pickWeighted<T>(
  rand: () => number,
  options: Weighted<T>[],
): T {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = rand() * total;
  for (const o of options) {
    if ((r -= o.weight) <= 0) return o.value;
  }
  return options[options.length - 1].value;
}
