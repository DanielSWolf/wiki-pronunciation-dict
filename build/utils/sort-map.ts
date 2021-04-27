export function sortMap<TKey, TValue>(
  map: Map<TKey, TValue>,
  comparer: (a: [TKey, TValue], b: [TKey, TValue]) => number,
): void {
  const entries = [...map.entries()];
  entries.sort(comparer);

  map.clear();
  for (const [key, value] of entries) {
    map.set(key, value);
  }
}
