import { DefaultMap } from './default-map';

export function createGroupedMap<TKey, TValue>(
  elements: Iterable<TValue>,
  keySelector: (element: TValue) => TKey,
): Map<TKey, TValue[]> {
  const result = new DefaultMap<TKey, TValue[]>(() => []);
  for (const element of elements) {
    const key = keySelector(element);
    result.getOrCreate(key).push(element);
  }
  return result;
}
