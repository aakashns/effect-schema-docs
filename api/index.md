---
title: API Reference
description: Complete API reference for Effect Schema
---

# API Reference

This is a quick reference for Effect Schema's API. For detailed documentation, see the guide sections.

## Schema Types

### Primitives

| Schema | Type | Description |
|--------|------|-------------|
| `Schema.String` | `string` | Any string |
| `Schema.Number` | `number` | Any number (includes NaN, ±Infinity) |
| `Schema.Boolean` | `boolean` | true or false |
| `Schema.BigIntFromSelf` | `bigint` | BigInt value |
| `Schema.SymbolFromSelf` | `symbol` | Symbol value |
| `Schema.Null` | `null` | null only |
| `Schema.Undefined` | `undefined` | undefined only |
| `Schema.Void` | `void` | void (accepts undefined) |
| `Schema.Unknown` | `unknown` | Any value |
| `Schema.Any` | `any` | Any value (unsafe) |
| `Schema.Never` | `never` | No value valid |
| `Schema.Object` | `object` | Non-null objects |

### Literals

| Schema | Type | Description |
|--------|------|-------------|
| `Schema.Literal("a", "b")` | `"a" \| "b"` | Exact literal values |
| `Schema.Enums(E)` | `E` | TypeScript enum |
| `Schema.UniqueSymbolFromSelf(s)` | `typeof s` | Specific symbol |

### Objects

| Schema | Type | Description |
|--------|------|-------------|
| `Schema.Struct({...})` | `{...}` | Object with properties |
| `Schema.Record({key, value})` | `Record<K, V>` | Dynamic keys |
| `Schema.TaggedStruct(tag, {...})` | `{_tag: T, ...}` | Tagged object |

### Collections

| Schema | Type | Description |
|--------|------|-------------|
| `Schema.Array(s)` | `readonly T[]` | Variable-length array |
| `Schema.NonEmptyArray(s)` | `readonly [T, ...T[]]` | At least one element |
| `Schema.Tuple(a, b, c)` | `readonly [A, B, C]` | Fixed-length tuple |

### Unions

| Schema | Type | Description |
|--------|------|-------------|
| `Schema.Union(a, b)` | `A \| B` | Union of schemas |
| `Schema.NullOr(s)` | `T \| null` | Nullable |
| `Schema.UndefinedOr(s)` | `T \| undefined` | Optional |
| `Schema.NullishOr(s)` | `T \| null \| undefined` | Nullish |

## Decoding Functions

| Function | Returns | Throws |
|----------|---------|--------|
| `Schema.decodeUnknownSync(s)(data)` | `Type` | ParseError |
| `Schema.decodeUnknownEither(s)(data)` | `Either<Type, ParseError>` | Never |
| `Schema.decodeUnknownOption(s)(data)` | `Option<Type>` | Never |
| `Schema.decodeUnknownPromise(s)(data)` | `Promise<Type>` | On reject |
| `Schema.decodeUnknown(s)(data)` | `Effect<Type, ParseError>` | Never |

## Encoding Functions

| Function | Returns | Throws |
|----------|---------|--------|
| `Schema.encodeSync(s)(value)` | `Encoded` | ParseError |
| `Schema.encodeEither(s)(value)` | `Either<Encoded, ParseError>` | Never |
| `Schema.encodeOption(s)(value)` | `Option<Encoded>` | Never |
| `Schema.encodePromise(s)(value)` | `Promise<Encoded>` | On reject |
| `Schema.encode(s)(value)` | `Effect<Encoded, ParseError>` | Never |

## Validation Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `Schema.is(s)(value)` | `boolean` | Type guard |
| `Schema.asserts(s)(value)` | `void` | Assert or throw |
| `Schema.validateSync(s)(value)` | `Type` | Validate Type |

## String Filters

| Filter | Description |
|--------|-------------|
| `Schema.minLength(n)` | Minimum length |
| `Schema.maxLength(n)` | Maximum length |
| `Schema.length(n)` | Exact length |
| `Schema.nonEmptyString()` | Non-empty |
| `Schema.pattern(regex)` | Match pattern |
| `Schema.startsWith(s)` | Starts with |
| `Schema.endsWith(s)` | Ends with |
| `Schema.includes(s)` | Contains |
| `Schema.trimmed()` | No whitespace |

## Number Filters

| Filter | Description |
|--------|-------------|
| `Schema.greaterThan(n)` | > n |
| `Schema.greaterThanOrEqualTo(n)` | >= n |
| `Schema.lessThan(n)` | < n |
| `Schema.lessThanOrEqualTo(n)` | <= n |
| `Schema.between(min, max)` | min <= x <= max |
| `Schema.positive()` | > 0 |
| `Schema.negative()` | < 0 |
| `Schema.nonPositive()` | <= 0 |
| `Schema.nonNegative()` | >= 0 |
| `Schema.int()` | Integer |
| `Schema.finite()` | Not NaN/Infinity |
| `Schema.nonNaN()` | Not NaN |
| `Schema.multipleOf(n)` | Divisible by n |

## Array Filters

| Filter | Description |
|--------|-------------|
| `Schema.minItems(n)` | Minimum items |
| `Schema.maxItems(n)` | Maximum items |
| `Schema.itemsCount(n)` | Exact count |

## Transformations

### Built-in

| Schema | From | To |
|--------|------|----|
| `Schema.NumberFromString` | `string` | `number` |
| `Schema.BooleanFromString` | `string` | `boolean` |
| `Schema.DateFromString` | `string` | `Date` |
| `Schema.BigInt` | `string` | `bigint` |
| `Schema.BigIntFromNumber` | `number` | `bigint` |
| `Schema.Trim` | `string` | `string` |
| `Schema.Lowercase` | `string` | `string` |
| `Schema.Uppercase` | `string` | `string` |
| `Schema.split(sep)` | `string` | `string[]` |
| `Schema.parseJson(s)` | `string` | parsed |

### Custom

| Function | Description |
|----------|-------------|
| `Schema.transform(from, to, options)` | Always-succeeding transform |
| `Schema.transformOrFail(from, to, options)` | Can-fail transform |
| `Schema.compose(a, b)` | Chain transformations |

## Struct Operations

| Function | Description |
|----------|-------------|
| `Schema.pick(...keys)` | Select properties |
| `Schema.omit(...keys)` | Remove properties |
| `Schema.partial(s)` | Make all optional |
| `Schema.required(s)` | Make all required |
| `Schema.extend(s)` | Add properties |
| `Schema.mutable(s)` | Remove readonly |
| `Schema.rename(mapping)` | Rename properties |

## Property Signatures

| Function | Description |
|----------|-------------|
| `Schema.optional(s)` | Optional property |
| `Schema.optional(s, {default})` | With default |
| `Schema.optional(s, {as: "Option"})` | As Option type |
| `Schema.propertySignature(s)` | Custom signature |
| `Schema.fromKey(key)` | Map from different key |

## Brands

| Function | Description |
|----------|-------------|
| `Schema.brand(name)` | Add brand |
| `Schema.fromBrand(constructor)` | From Brand constructor |

## Classes

| Function | Description |
|----------|-------------|
| `Schema.Class<T>()(name, fields)` | Schema class |
| `Schema.TaggedClass<T>()(tag, fields)` | Tagged class |
| `Schema.TaggedError<T>()(tag, fields)` | Error class |

## Utilities

| Function | Description |
|----------|-------------|
| `Schema.typeSchema(s)` | Extract Type schema |
| `Schema.encodedSchema(s)` | Extract Encoded schema |
| `Schema.keyof(s)` | Keys schema |
| `Schema.format(s)` | Format as string |
| `Schema.isSchema(x)` | Type guard |

## Parse Options

```typescript
type ParseOptions = {
  errors?: "first" | "all"
  onExcessProperty?: "ignore" | "error" | "preserve"
  preserveKeyOrder?: boolean
}
```

## Annotations

```typescript
schema.annotations({
  identifier?: string
  title?: string
  description?: string
  examples?: T[]
  default?: T
  message?: (issue) => string
  jsonSchema?: object
  arbitrary?: (fc) => fc.Arbitrary<T>
  pretty?: (t) => string
  equivalence?: Equivalence<T>
})
```

