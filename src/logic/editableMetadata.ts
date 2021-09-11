import clone from "clone";

export class EditableMetadata<T> {
  values: T;
  constructor(defaultValues: T) {
    this.values = defaultValues;
  }

  public produce(): T {
    return clone(this.values, false);
  }
}
