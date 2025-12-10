---
title: Built-in Filters
description: Learn about all built-in validation filters in Effect Schema
---

# Built-in Filters

Filters add validation rules to schemas without changing the type. They're applied during both decoding and encoding, ensuring data integrity in both directions.

## How Filters Work

Filters wrap a schema with additional validation:

```typescript
import { Schema } from "effect"

// Schema.Number accepts any number
const AnyNumber = Schema.Number

// With filter: only positive numbers pass
const PositiveNumber = Schema.Number.pipe(Schema.positive())

// Both have the same type
type A = typeof AnyNumber.Type       // number
type B = typeof PositiveNumber.Type  // number

// But different validation
Schema.decodeUnknownSync(AnyNumber)(-5)       // ✅ -5
Schema.decodeUnknownSync(PositiveNumber)(-5)  // ❌ ParseError
```

## String Filters

### Length Constraints

```typescript
import { Schema } from "effect"

// Minimum length
Schema.String.pipe(Schema.minLength(3))     // at least 3 chars
Schema.String.pipe(Schema.nonEmptyString()) // shorthand for minLength(1)

// Maximum length
Schema.String.pipe(Schema.maxLength(100))   // at most 100 chars

// Exact length
Schema.String.pipe(Schema.length(5))        // exactly 5 chars

// Length range
Schema.String.pipe(Schema.length({ min: 5, max: 10 }))  // 5-10 chars
```

### Pattern Matching

```typescript
import { Schema } from "effect"

// Regex pattern
Schema.String.pipe(Schema.pattern(/^[A-Z][a-z]+$/))

// Common patterns
const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
)

const Hex = Schema.String.pipe(
  Schema.pattern(/^[0-9A-Fa-f]+$/)
)

const Slug = Schema.String.pipe(
  Schema.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
)
```

### Content Checks

```typescript
import { Schema } from "effect"

// Prefix/suffix
Schema.String.pipe(Schema.startsWith("https://"))
Schema.String.pipe(Schema.endsWith(".json"))

// Contains
Schema.String.pipe(Schema.includes("@"))

// Trimmed (no leading/trailing whitespace)
Schema.String.pipe(Schema.trimmed())
```

### Pre-built String Schemas

```typescript
import { Schema } from "effect"

Schema.NonEmptyString         // minLength(1)
Schema.NonEmptyTrimmedString  // trimmed + nonEmpty
Schema.UUID                   // UUID format
Schema.ULID                   // ULID format
```

## Number Filters

### Comparison Filters

```typescript
import { Schema } from "effect"

// Greater than
Schema.Number.pipe(Schema.greaterThan(0))           // > 0
Schema.Number.pipe(Schema.greaterThanOrEqualTo(0))  // >= 0

// Less than
Schema.Number.pipe(Schema.lessThan(100))            // < 100
Schema.Number.pipe(Schema.lessThanOrEqualTo(100))   // <= 100

// Between (inclusive)
Schema.Number.pipe(Schema.between(0, 100))          // >= 0 && <= 100
```

### Sign Filters

```typescript
import { Schema } from "effect"

Schema.Number.pipe(Schema.positive())     // > 0
Schema.Number.pipe(Schema.negative())     // < 0
Schema.Number.pipe(Schema.nonPositive())  // <= 0
Schema.Number.pipe(Schema.nonNegative())  // >= 0
```

### Integer and Divisibility

```typescript
import { Schema } from "effect"

// Integer only (no decimals)
Schema.Number.pipe(Schema.int())

// Multiple of a value
Schema.Number.pipe(Schema.multipleOf(5))   // 0, 5, 10, 15, ...
Schema.Number.pipe(Schema.multipleOf(0.1)) // 0.1, 0.2, 0.3, ...
```

### Special Value Handling

```typescript
import { Schema } from "effect"

// Exclude NaN
Schema.Number.pipe(Schema.nonNaN())

// Exclude NaN and Infinity
Schema.Number.pipe(Schema.finite())
```

### Pre-built Number Schemas

```typescript
import { Schema } from "effect"

Schema.Int           // integer only
Schema.Positive      // > 0
Schema.Negative      // < 0
Schema.NonPositive   // <= 0
Schema.NonNegative   // >= 0
Schema.Finite        // finite (no NaN, no ±Infinity)
Schema.NonNaN        // not NaN
Schema.JsonNumber    // valid JSON number (finite)
```

## BigInt Filters

```typescript
import { Schema } from "effect"

Schema.BigIntFromSelf.pipe(Schema.greaterThanBigInt(0n))
Schema.BigIntFromSelf.pipe(Schema.greaterThanOrEqualToBigInt(0n))
Schema.BigIntFromSelf.pipe(Schema.lessThanBigInt(1000n))
Schema.BigIntFromSelf.pipe(Schema.lessThanOrEqualToBigInt(1000n))
Schema.BigIntFromSelf.pipe(Schema.betweenBigInt(0n, 1000n))
Schema.BigIntFromSelf.pipe(Schema.positiveBigInt())
Schema.BigIntFromSelf.pipe(Schema.negativeBigInt())
Schema.BigIntFromSelf.pipe(Schema.nonPositiveBigInt())
Schema.BigIntFromSelf.pipe(Schema.nonNegativeBigInt())
```

## Array Filters

```typescript
import { Schema } from "effect"

// Minimum items
Schema.Array(Schema.String).pipe(Schema.minItems(1))

// Maximum items
Schema.Array(Schema.String).pipe(Schema.maxItems(10))

// Exact count
Schema.Array(Schema.String).pipe(Schema.itemsCount(5))
```

## Date Filters

```typescript
import { Schema } from "effect"

// Valid date (not Invalid Date)
Schema.DateFromSelf.pipe(Schema.validDate())

// Note: For date ranges, use custom filters
```

## Combining Filters

Chain multiple filters with `.pipe()`:

```typescript
import { Schema } from "effect"

const Username = Schema.String.pipe(
  Schema.minLength(3),
  Schema.maxLength(20),
  Schema.pattern(/^[a-zA-Z0-9_]+$/),
  Schema.trimmed()
)

const Age = Schema.Number.pipe(
  Schema.int(),
  Schema.between(0, 150)
)

const Price = Schema.Number.pipe(
  Schema.finite(),
  Schema.nonNegative(),
  Schema.multipleOf(0.01)  // cents precision
)
```

## Custom Error Messages

Override default error messages:

```typescript
import { Schema } from "effect"

const Password = Schema.String.pipe(
  Schema.minLength(8, {
    message: () => "Password must be at least 8 characters"
  }),
  Schema.pattern(/[A-Z]/, {
    message: () => "Password must contain at least one uppercase letter"
  }),
  Schema.pattern(/[0-9]/, {
    message: () => "Password must contain at least one number"
  })
)
```

## Filter Annotations

Filters can have annotations for JSON Schema, etc.:

```typescript
import { Schema } from "effect"

const Rating = Schema.Number.pipe(
  Schema.between(1, 5, {
    title: "Rating",
    description: "User rating from 1 to 5 stars"
  })
)
```

## When Filters Run

Filters validate during:

1. **Decoding**: Validating external data
2. **Encoding**: Validating before serialization
3. **Validation**: Using `is()` or `asserts()`

```typescript
import { Schema } from "effect"

const PositiveNumber = Schema.Number.pipe(Schema.positive())

// Decode: filters run
Schema.decodeUnknownSync(PositiveNumber)(-5)  // ❌ fails

// Encode: filters run (important!)
Schema.encodeSync(PositiveNumber)(-5)  // ❌ also fails

// Is check: filters run
Schema.is(PositiveNumber)(-5)  // false

// Asserts: filters run
Schema.asserts(PositiveNumber)(-5)  // throws
```

## Performance Considerations

Filters are efficient:
- Simple predicates with minimal overhead
- No allocation for passing values
- Early exit on failure

For complex validation, consider:

```typescript
import { Schema } from "effect"

// ✅ Single filter with combined check
Schema.String.pipe(
  Schema.filter((s) => s.length >= 3 && s.length <= 20)
)

// ⚠️ Multiple filters (slightly more overhead)
Schema.String.pipe(
  Schema.minLength(3),
  Schema.maxLength(20)
)
```

In practice, the difference is negligible for most use cases. Prefer readability.

## Quick Reference

### String Filters

| Filter | Description |
|--------|-------------|
| `minLength(n)` | At least n characters |
| `maxLength(n)` | At most n characters |
| `length(n)` | Exactly n characters |
| `length({ min, max })` | Between min and max chars |
| `nonEmptyString()` | At least 1 character |
| `pattern(regex)` | Must match regex |
| `startsWith(s)` | Must start with s |
| `endsWith(s)` | Must end with s |
| `includes(s)` | Must contain s |
| `trimmed()` | No leading/trailing whitespace |

### Number Filters

| Filter | Description |
|--------|-------------|
| `greaterThan(n)` | > n |
| `greaterThanOrEqualTo(n)` | >= n |
| `lessThan(n)` | < n |
| `lessThanOrEqualTo(n)` | <= n |
| `between(min, max)` | >= min && <= max |
| `positive()` | > 0 |
| `negative()` | < 0 |
| `nonPositive()` | <= 0 |
| `nonNegative()` | >= 0 |
| `int()` | Integer only |
| `multipleOf(n)` | Divisible by n |
| `finite()` | Not NaN or ±Infinity |
| `nonNaN()` | Not NaN |

### Array Filters

| Filter | Description |
|--------|-------------|
| `minItems(n)` | At least n items |
| `maxItems(n)` | At most n items |
| `itemsCount(n)` | Exactly n items |

## Next Steps

- [Brands](/guide/brands) - Branded types for type safety
- [Transformations](/guide/transformations) - Change data types
- [Optional & Nullable](/guide/optional-nullable) - Handle missing values

