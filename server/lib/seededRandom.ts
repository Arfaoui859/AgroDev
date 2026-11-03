/**
 * Deterministic PRNG helpers for the demo/simulated endpoints.
 *
 * Several modules synthesise illustrative figures (soil history, public market
 * previews, ...). Those values are already labelled simulated, but generating
 * them with Math.random() reshuffles the data on every request, which makes a
 * dashboard flicker and makes tests non-deterministic. Seeding the generator
 * from a stable key keeps the shape and values constant for the same key.
 */

/** FNV-1a 32-bit hash of a string, as an unsigned integer. */
function hashSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Return `count` deterministic fractions in [0, 1) for a given key. The same
 * key always yields the same sequence.
 */
export function seededFractions(key: string, count: number): number[] {
  let h = hashSeed(key);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    h ^= h >>> 16;
    out.push((h >>> 0) / 4294967296);
  }
  return out;
}

/**
 * A small stateful generator seeded from a key, for call sites that consume an
 * unknown number of values (e.g. nested map loops).
 */
export function seededRandom(key: string): () => number {
  let h = hashSeed(key);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
