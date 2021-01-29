export function createGroupedMap<TKey, TValue>(
  elements: Iterable<TValue>,
  keySelector: (element: TValue) => TKey,
): Map<TKey, TValue[]> {
  const result = new Map<TKey, TValue[]>();
  for (const element of elements) {
    const key = keySelector(element);
    const list = result.get(key);
    if (list !== undefined) {
      list.push(element);
    } else {
      result.set(key, [element]);
    }
  }
  return result;
}
