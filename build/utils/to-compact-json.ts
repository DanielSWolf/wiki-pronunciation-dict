import inspect from 'object-inspect';

/**
 * Similar to JSON.stringify(), but with different formatting.
 * Uses multi-line layout for everything except primitive arrays.
 */
export function toCompactJson(value: unknown): string {
  return unknownToJson(value, '');
}

const tab = '  ';

function unknownToJson(value: unknown, tailIndent: string): string {
  if (isPrimitive(value)) {
    return primitiveValueToJson(value);
  }
  if (typeof value === 'object') {
    return value instanceof Array
      ? arrayToJson(value, tailIndent)
      : objectToJson(value!, tailIndent);
  }
  throw new Error(`Invalid value: ${inspect(value)}.`);
}

function objectToJson(object: object, tailIndent: string): string {
  const indentedBody = Object.entries(object)
    .map(
      ([key, value]) =>
        tailIndent +
        tab +
        primitiveValueToJson(key) +
        ': ' +
        unknownToJson(value, tailIndent + tab),
    )
    .join(',\n');
  return `{\n${indentedBody}\n${tailIndent}}`;
}

function arrayToJson(array: unknown[], tailIndent: string): string {
  if (isPrimitiveArray(array)) {
    const body = array.map(primitiveValueToJson).join(', ');
    return `[${body}]`;
  } else {
    const indentedBody = array
      .map(value => tailIndent + tab + unknownToJson(value, tailIndent + tab))
      .join(',\n');
    return `[\n${indentedBody}\n${tailIndent}]`;
  }
}

function primitiveValueToJson(value: Primitive) {
  return JSON.stringify(value);
}

type Primitive = string | number | boolean | null;

function isPrimitiveArray(array: unknown[]): array is Primitive[] {
  return array.every(isPrimitive);
}

function isPrimitive(value: unknown): value is Primitive {
  const type = typeof value;
  return (
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    value === null
  );
}
