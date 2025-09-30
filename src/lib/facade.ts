export interface Facade<T> {
  get value(): T;
  set value(v: T);
}

export class AsyncFacade<T> implements Facade<T> {

  private _value?: T;

  constructor(private readonly getter: () => T, private readonly setter: (v: T) => Promise<void>) {
  }

  get value(): T {
    return this._value ?? this.getter();
  }

  set value(v: T) {
    this._value = v;
    this.setter(v).then(() => {
      this._value = undefined;
    });
  }
}
