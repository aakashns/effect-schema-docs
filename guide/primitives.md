---
title: Primitives
description: Learn about primitive schema types in Effect Schema - strings, numbers, booleans, and more
---

# Primitives

Primitive schemas are the building blocks of all other schemas. They represent the basic JavaScript types.

## String

The most common primitive. Matches any JavaScript string:

```typescript
import { Schema } from "effect"

const StringSchema = Schema.String
// Schema<string, string, never>

Schema.decodeUnknownSync(StringSchema)("hello")  // ✅ "hello"
Schema.decodeUnknownSync(StringSchema)(123)      // ❌ ParseError
Schema.decodeUnknownSync(StringSchema)(null)     // ❌ ParseError
```

### String Refinements

Schema provides many built-in string refinements:

```typescript
import { Schema } from "effect"

// Length constraints
Schema.String.pipe(Schema.minLength(1))        // at least 1 character
Schema.String.pipe(Schema.maxLength(100))      // at most 100 characters
Schema.String.pipe(Schema.length(5))           // exactly 5 characters
Schema.String.pipe(Schema.length({ min: 5, max: 10 }))  // between 5-10 chars
Schema.String.pipe(Schema.nonEmptyString())    // shorthand for minLength(1)

// Pattern matching
Schema.String.pipe(Schema.pattern(/^[A-Z]/))   // must start with uppercase

// Content checks
Schema.String.pipe(Schema.startsWith("https://"))
Schema.String.pipe(Schema.endsWith(".com"))
Schema.String.pipe(Schema.includes("@"))

// Whitespace
Schema.String.pipe(Schema.trimmed())           // no leading/trailing whitespace

// Combine multiple
const Username = Schema.String.pipe(
  Schema.minLength(3),
  Schema.maxLength(20),
  Schema.pattern(/^[a-zA-Z0-9_]+$/)
)
```

### Pre-built String Schemas

Common string formats have pre-built schemas:

```typescript
import { Schema } from "effect"

// Non-empty strings
Schema.NonEmptyString          // string with minLength(1)
Schema.NonEmptyTrimmedString   // trimmed and non-empty

// UUIDs
Schema.UUID                    // validates UUID format

// ULIDs
Schema.ULID                    // validates ULID format
```

### String Transformations

Transform strings to/from other types:

```typescript
import { Schema } from "effect"

// String → trimmed string
const Trimmed = Schema.Trim
Schema.decodeSync(Trimmed)("  hello  ")  // "hello"

// String → lowercase
const Lower = Schema.Lowercase
Schema.decodeSync(Lower)("HELLO")  // "hello"

// String → uppercase
const Upper = Schema.Uppercase
Schema.decodeSync(Upper)("hello")  // "HELLO"

// Split string
const CommaSeparated = Schema.split(",")
Schema.decodeSync(CommaSeparated)("a,b,c")  // ["a", "b", "c"]
```

## Number

Matches JavaScript numbers (including `NaN` and `Infinity`):

```typescript
import { Schema } from "effect"

const NumberSchema = Schema.Number
// Schema<number, number, never>

Schema.decodeUnknownSync(NumberSchema)(42)        // ✅ 42
Schema.decodeUnknownSync(NumberSchema)(3.14)      // ✅ 3.14
Schema.decodeUnknownSync(NumberSchema)(NaN)       // ✅ NaN
Schema.decodeUnknownSync(NumberSchema)(Infinity)  // ✅ Infinity
Schema.decodeUnknownSync(NumberSchema)("42")      // ❌ ParseError
```

### Number Refinements

```typescript
import { Schema } from "effect"

// Range constraints
Schema.Number.pipe(Schema.greaterThan(0))           // > 0
Schema.Number.pipe(Schema.greaterThanOrEqualTo(0))  // >= 0
Schema.Number.pipe(Schema.lessThan(100))            // < 100
Schema.Number.pipe(Schema.lessThanOrEqualTo(100))   // <= 100
Schema.Number.pipe(Schema.between(0, 100))          // >= 0 and <= 100

// Integer constraint
Schema.Number.pipe(Schema.int())                    // must be integer

// Sign constraints
Schema.Number.pipe(Schema.positive())               // > 0
Schema.Number.pipe(Schema.negative())               // < 0
Schema.Number.pipe(Schema.nonPositive())            // <= 0
Schema.Number.pipe(Schema.nonNegative())            // >= 0

// Special value handling
Schema.Number.pipe(Schema.finite())                 // excludes NaN, ±Infinity
Schema.Number.pipe(Schema.nonNaN())                 // excludes only NaN

// Divisibility
Schema.Number.pipe(Schema.multipleOf(5))            // must be divisible by 5

// Combine multiple
const Age = Schema.Number.pipe(
  Schema.int(),
  Schema.between(0, 150)
)
```

### Pre-built Number Schemas

```typescript
import { Schema } from "effect"

Schema.Int           // integer only
Schema.Positive      // > 0
Schema.Negative      // < 0
Schema.NonPositive   // <= 0
Schema.NonNegative   // >= 0
Schema.Finite        // excludes NaN and Infinity
Schema.NonNaN        // excludes NaN
Schema.JsonNumber    // valid JSON number (finite)
```

### Number Transformations

```typescript
import { Schema } from "effect"

// String → Number
const NumberFromString = Schema.NumberFromString
Schema.decodeSync(NumberFromString)("42")      // 42
Schema.decodeSync(NumberFromString)("3.14")    // 3.14
Schema.decodeSync(NumberFromString)("NaN")     // NaN
Schema.decodeSync(NumberFromString)("Infinity") // Infinity

// Clamp numbers to a range
const ClampedAge = Schema.Number.pipe(Schema.clamp(0, 150))
Schema.decodeSync(ClampedAge)(-5)    // 0 (clamped to min)
Schema.decodeSync(ClampedAge)(200)   // 150 (clamped to max)
Schema.decodeSync(ClampedAge)(30)    // 30 (unchanged)
```

## Boolean

Matches `true` or `false`:

```typescript
import { Schema } from "effect"

const BooleanSchema = Schema.Boolean
// Schema<boolean, boolean, never>

Schema.decodeUnknownSync(BooleanSchema)(true)   // ✅ true
Schema.decodeUnknownSync(BooleanSchema)(false)  // ✅ false
Schema.decodeUnknownSync(BooleanSchema)(1)      // ❌ ParseError
Schema.decodeUnknownSync(BooleanSchema)("true") // ❌ ParseError
```

### Boolean Transformations

```typescript
import { Schema } from "effect"

// String → Boolean
const BoolFromString = Schema.BooleanFromString
Schema.decodeSync(BoolFromString)("true")   // true
Schema.decodeSync(BoolFromString)("false")  // false

// Number → Boolean (0 = false, non-0 = true)
const BoolFromNumber = Schema.BooleanFromNumber
Schema.decodeSync(BoolFromNumber)(0)  // false
Schema.decodeSync(BoolFromNumber)(1)  // true

// Negate boolean
const Negated = Schema.Not
Schema.decodeSync(Negated)(true)   // false
Schema.decodeSync(Negated)(false)  // true
```

## BigInt

For JavaScript BigInt values:

```typescript
import { Schema } from "effect"

const BigIntSchema = Schema.BigIntFromSelf
// Schema<bigint, bigint, never>

Schema.decodeUnknownSync(BigIntSchema)(123n)  // ✅ 123n
Schema.decodeUnknownSync(BigIntSchema)(123)   // ❌ ParseError
```

### BigInt Transformations

```typescript
import { Schema } from "effect"

// String → BigInt
const BigIntFromString = Schema.BigInt
Schema.decodeSync(BigIntFromString)("123")  // 123n

// Number → BigInt
const BigIntFromNumber = Schema.BigIntFromNumber
Schema.decodeSync(BigIntFromNumber)(123)  // 123n
```

### BigInt Refinements

```typescript
import { Schema } from "effect"

Schema.BigIntFromSelf.pipe(Schema.greaterThanBigInt(0n))
Schema.BigIntFromSelf.pipe(Schema.lessThanBigInt(1000n))
Schema.BigIntFromSelf.pipe(Schema.betweenBigInt(0n, 1000n))
Schema.BigIntFromSelf.pipe(Schema.positiveBigInt())
Schema.BigIntFromSelf.pipe(Schema.negativeBigInt())
```

## Symbol

For JavaScript symbols:

```typescript
import { Schema } from "effect"

// Any symbol
const SymbolSchema = Schema.SymbolFromSelf
Schema.decodeUnknownSync(SymbolSchema)(Symbol("test"))  // ✅

// Symbol.for (can be encoded/decoded to string)
const GlobalSymbol = Schema.Symbol
Schema.decodeSync(GlobalSymbol)("mySymbol")  // Symbol.for("mySymbol")
Schema.encodeSync(GlobalSymbol)(Symbol.for("mySymbol"))  // "mySymbol"

// Specific unique symbol
const mySymbol = Symbol.for("mySpecificSymbol")
const SpecificSymbol = Schema.UniqueSymbolFromSelf(mySymbol)
```

## Null and Undefined

```typescript
import { Schema } from "effect"

// Null
const NullSchema = Schema.Null
Schema.decodeUnknownSync(NullSchema)(null)       // ✅ null
Schema.decodeUnknownSync(NullSchema)(undefined)  // ❌ ParseError

// Undefined
const UndefinedSchema = Schema.Undefined
Schema.decodeUnknownSync(UndefinedSchema)(undefined)  // ✅ undefined
Schema.decodeUnknownSync(UndefinedSchema)(null)       // ❌ ParseError

// Void (accepts undefined, useful for function returns)
const VoidSchema = Schema.Void
Schema.decodeUnknownSync(VoidSchema)(undefined)  // ✅ undefined
```

## Never, Unknown, Any

Special types for edge cases:

```typescript
import { Schema } from "effect"

// Never - no value is valid
const NeverSchema = Schema.Never
// Schema.decodeUnknownSync(NeverSchema)(anything)  // Always fails

// Unknown - any value is valid, no transformation
const UnknownSchema = Schema.Unknown
Schema.decodeUnknownSync(UnknownSchema)("anything")  // ✅ "anything"
Schema.decodeUnknownSync(UnknownSchema)(null)        // ✅ null
Schema.decodeUnknownSync(UnknownSchema)({ x: 1 })    // ✅ { x: 1 }

// Any - similar to Unknown but typed as 'any'
const AnySchema = Schema.Any
```

::: warning Unknown vs Any
Prefer `Schema.Unknown` over `Schema.Any`. Both accept any value, but `Unknown` preserves type safety by typing the result as `unknown`, forcing you to handle the type properly.
:::

## Object

Matches any non-null object (including arrays and functions):

```typescript
import { Schema } from "effect"

const ObjectSchema = Schema.Object
// Schema<object, object, never>

Schema.decodeUnknownSync(ObjectSchema)({})          // ✅ {}
Schema.decodeUnknownSync(ObjectSchema)([1, 2, 3])   // ✅ [1, 2, 3]
Schema.decodeUnknownSync(ObjectSchema)(() => {})    // ✅ function
Schema.decodeUnknownSync(ObjectSchema)(null)        // ❌ ParseError
Schema.decodeUnknownSync(ObjectSchema)("string")    // ❌ ParseError
```

## Date

For JavaScript Date objects:

```typescript
import { Schema } from "effect"

// Date as-is (Type and Encoded are both Date)
const DateFromSelf = Schema.DateFromSelf
Schema.decodeUnknownSync(DateFromSelf)(new Date())  // ✅

// String → Date (ISO 8601 format)
const DateFromString = Schema.DateFromString
Schema.decodeSync(DateFromString)("2024-01-15T10:30:00Z")  // Date object
Schema.encodeSync(DateFromString)(new Date())  // ISO string

// Number (timestamp) → Date
const DateFromNumber = Schema.DateFromNumber
Schema.decodeSync(DateFromNumber)(1705315800000)  // Date object
```

### Date Refinements

```typescript
import { Schema } from "effect"

// Valid date (not Invalid Date)
Schema.DateFromSelf.pipe(Schema.validDate())
```

## Summary Table

| Schema | Type | Encoded | Notes |
|--------|------|---------|-------|
| `String` | `string` | `string` | Any string |
| `Number` | `number` | `number` | Includes NaN, ±Infinity |
| `Boolean` | `boolean` | `boolean` | true or false |
| `BigIntFromSelf` | `bigint` | `bigint` | BigInt values |
| `BigInt` | `bigint` | `string` | String ↔ BigInt |
| `SymbolFromSelf` | `symbol` | `symbol` | Any symbol |
| `Symbol` | `symbol` | `string` | Global symbols |
| `Null` | `null` | `null` | Only null |
| `Undefined` | `undefined` | `undefined` | Only undefined |
| `Void` | `void` | `void` | For function returns |
| `Never` | `never` | `never` | No valid value |
| `Unknown` | `unknown` | `unknown` | Any value |
| `Any` | `any` | `any` | Any value (unsafe) |
| `Object` | `object` | `object` | Non-null objects |
| `DateFromSelf` | `Date` | `Date` | Date objects |
| `DateFromString` | `Date` | `string` | ISO string ↔ Date |

## Next Steps

Now that you understand primitives:

- [Literals & Enums](/guide/literals-enums) - Exact values and TypeScript enums
- [Structs](/guide/structs) - Object schemas with properties
- [Filters](/guide/filters) - All built-in validation rules

