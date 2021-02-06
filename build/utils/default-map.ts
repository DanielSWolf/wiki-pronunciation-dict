export class DefaultMap<TKey, TValue> extends Map<TKey, TValue> {
  constructor(private getDefaultValue: (key: TKey) => TValue) {
    super();
  }

  getOrCreate(key: TKey): TValue {
    if (!this.has(key)) {
      this.set(key, this.getDefaultValue(key));
    }
    return this.get(key)!;
  }
}
