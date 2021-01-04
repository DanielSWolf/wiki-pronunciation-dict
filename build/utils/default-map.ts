export class DefaultMap<TKey, TValue> extends Map<TKey, TValue> {
  constructor(private getDefaultValue: (key: TKey) => TValue) {
    super();
  }

  get(key: TKey): TValue {
    if (!this.has(key)) {
      this.set(key, this.getDefaultValue(key));
    }
    return super.get(key)!;
  }
}
