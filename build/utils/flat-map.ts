export function createFlatMap<TKey, TValue>(
  entries: Iterable<[TKey[], TValue]>,
): Map<TKey, TValue> {
  return new Map<TKey, TValue>(
    [...entries].flatMap(([keys, value]) => keys.map(key => [key, value])),
  );
}
