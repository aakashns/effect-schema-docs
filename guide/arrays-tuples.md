---
title: Arrays & Tuples
description: Learn how to define array and tuple schemas in Effect Schema
---

# Arrays & Tuples

Effect Schema provides powerful tools for defining collections, from simple arrays to complex tuple structures.

## Arrays

### Basic Array

Define an array of any schema type:

```typescript
import { Schema } from "effect"

// Array of strings
const StringArray = Schema.Array(Schema.String)
// Schema<readonly string[], readonly string[], never>

Schema.decodeUnknownSync(StringArray)([])               // ✅ []
Schema.decodeUnknownSync(StringArray)(["a", "b", "c"])  // ✅ ["a", "b", "c"]
Schema.decodeUnknownSync(StringArray)([1, 2, 3])        // ❌ ParseError

// Array of numbers
const NumberArray = Schema.Array(Schema.Number)

// Array of objects
const UserArray = Schema.Array(
  Schema.Struct({
    id: Schema.String,
    name: Schema.String
  })
)
```

::: tip Arrays are readonly
By default, array types are `readonly`. This prevents accidental mutations and aligns with functional programming principles.
:::

### Array Refinements

Add validation rules to arrays:

```typescript
import { Schema } from "effect"

// Minimum items
const AtLeastThree = Schema.Array(Schema.String).pipe(
  Schema.minItems(3)
)

// Maximum items
const AtMostTen = Schema.Array(Schema.String).pipe(
  Schema.maxItems(10)
)

// Exact count
const ExactlyFive = Schema.Array(Schema.String).pipe(
  Schema.itemsCount(5)
)

// Range
const BetweenThreeAndTen = Schema.Array(Schema.String).pipe(
  Schema.minItems(3),
  Schema.maxItems(10)
)
```

### NonEmptyArray

Require at least one element:

```typescript
import { Schema } from "effect"

const NonEmptyStrings = Schema.NonEmptyArray(Schema.String)
// Schema<readonly [string, ...string[]], readonly [string, ...string[]], never>

Schema.decodeUnknownSync(NonEmptyStrings)(["a"])        // ✅
Schema.decodeUnknownSync(NonEmptyStrings)(["a", "b"])   // ✅
Schema.decodeUnknownSync(NonEmptyStrings)([])           // ❌ ParseError
```

The type correctly represents that there's always at least one element:

```typescript
type NonEmptyStrings = typeof NonEmptyStrings.Type
// readonly [string, ...string[]]
```

### Array Utilities

Extract the first element:

```typescript
import { Schema } from "effect"

const StringArray = Schema.Array(Schema.String)

// head - returns Option<T>
const HeadString = StringArray.pipe(Schema.head)
// Schema<Option<string>, readonly string[]>

// headOrElse - returns T with default
const HeadOrDefault = StringArray.pipe(
  Schema.headOrElse(() => "default")
)
// Schema<string, readonly string[]>
```

## Tuples

Tuples define arrays with specific element types at each position.

### Basic Tuple

```typescript
import { Schema } from "effect"

// Two-element tuple
const Pair = Schema.Tuple(Schema.String, Schema.Number)
// Schema<readonly [string, number], readonly [string, number], never>

Schema.decodeUnknownSync(Pair)(["hello", 42])  // ✅ ["hello", 42]
Schema.decodeUnknownSync(Pair)(["hello"])      // ❌ Wrong length
Schema.decodeUnknownSync(Pair)([42, "hello"])  // ❌ Wrong types
```

### Multiple Elements

```typescript
import { Schema } from "effect"

const Triple = Schema.Tuple(
  Schema.String,   // First element: string
  Schema.Number,   // Second element: number
  Schema.Boolean   // Third element: boolean
)

type Triple = typeof Triple.Type
// readonly [string, number, boolean]

const RGB = Schema.Tuple(
  Schema.Number,
  Schema.Number,
  Schema.Number
)
// readonly [number, number, number]
```

### Optional Elements

Mark elements as optional with `Schema.optionalElement`:

```typescript
import { Schema } from "effect"

const FlexibleTuple = Schema.Tuple(
  Schema.String,                              // Required
  Schema.optionalElement(Schema.Number),      // Optional
  Schema.optionalElement(Schema.Boolean)      // Optional
)

type FlexibleTuple = typeof FlexibleTuple.Type
// readonly [string, number?, boolean?]

Schema.decodeUnknownSync(FlexibleTuple)(["hello"])              // ✅
Schema.decodeUnknownSync(FlexibleTuple)(["hello", 42])          // ✅
Schema.decodeUnknownSync(FlexibleTuple)(["hello", 42, true])    // ✅
```

### Rest Elements

Add rest elements for variable-length tuples:

```typescript
import { Schema } from "effect"

// Fixed elements followed by rest
const StringsThenNumbers = Schema.Tuple(
  [Schema.String, Schema.String],  // First two elements: strings
  Schema.Number                    // Rest: numbers
)
// readonly [string, string, ...number[]]

Schema.decodeUnknownSync(StringsThenNumbers)(["a", "b"])             // ✅
Schema.decodeUnknownSync(StringsThenNumbers)(["a", "b", 1])          // ✅
Schema.decodeUnknownSync(StringsThenNumbers)(["a", "b", 1, 2, 3])    // ✅

// Another example
const HeaderAndData = Schema.Tuple(
  [Schema.Struct({ name: Schema.String })],  // Header
  Schema.Array(Schema.Number)                 // Data rows
)
```

### Annotated Elements

Add annotations to specific elements:

```typescript
import { Schema } from "effect"

const Coordinates = Schema.Tuple(
  Schema.element(Schema.Number).annotations({ 
    description: "X coordinate" 
  }),
  Schema.element(Schema.Number).annotations({ 
    description: "Y coordinate" 
  })
)
```

## ArrayEnsure

Convert single values to arrays:

```typescript
import { Schema } from "effect"

const StringOrStrings = Schema.ArrayEnsure(Schema.String)
// Accepts: string | string[]
// Returns: string[]

Schema.decodeSync(StringOrStrings)("hello")       // ["hello"]
Schema.decodeSync(StringOrStrings)(["a", "b"])    // ["a", "b"]

// Encoding reverses the transformation
Schema.encodeSync(StringOrStrings)(["hello"])     // "hello" (single item)
Schema.encodeSync(StringOrStrings)(["a", "b"])    // ["a", "b"] (multiple)
```

Similarly for non-empty arrays:

```typescript
import { Schema } from "effect"

const NonEmptyEnsure = Schema.NonEmptyArrayEnsure(Schema.String)
// Accepts: string | [string, ...string[]]
// Returns: [string, ...string[]]
```

## Practical Examples

### CSV Row

```typescript
import { Schema } from "effect"

const CsvRow = Schema.Tuple(
  Schema.String,                    // Name
  Schema.NumberFromString,          // Age
  Schema.String,                    // Email
  Schema.optionalElement(Schema.String)  // Notes
)

const parsed = Schema.decodeSync(CsvRow)(["Alice", "30", "alice@example.com"])
// ["Alice", 30, "alice@example.com"]
```

### API Pagination

```typescript
import { Schema } from "effect"

const PaginatedResponse = Schema.Struct({
  data: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String
    })
  ).pipe(Schema.maxItems(100)),
  
  pagination: Schema.Struct({
    page: Schema.Number.pipe(Schema.int(), Schema.positive()),
    totalPages: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
    totalItems: Schema.Number.pipe(Schema.int(), Schema.nonNegative())
  })
})
```

### Coordinate Systems

```typescript
import { Schema } from "effect"

// 2D Point
const Point2D = Schema.Tuple(Schema.Number, Schema.Number)

// 3D Point
const Point3D = Schema.Tuple(Schema.Number, Schema.Number, Schema.Number)

// Polygon (at least 3 points)
const Polygon = Schema.Array(Point2D).pipe(Schema.minItems(3))

// Line (exactly 2 points)
const Line = Schema.Tuple(Point2D, Point2D)
```

### Matrix Operations

```typescript
import { Schema } from "effect"

// Row of numbers
const Row = Schema.NonEmptyArray(Schema.Number)

// Matrix (at least one row)
const Matrix = Schema.NonEmptyArray(Row)

// Fixed 3x3 matrix
const Matrix3x3 = Schema.Tuple(
  Schema.Tuple(Schema.Number, Schema.Number, Schema.Number),
  Schema.Tuple(Schema.Number, Schema.Number, Schema.Number),
  Schema.Tuple(Schema.Number, Schema.Number, Schema.Number)
)
```

### Tagged Results

```typescript
import { Schema } from "effect"

// Success: ["ok", data]
// Error: ["error", message]
const Result = Schema.Union(
  Schema.Tuple(Schema.Literal("ok"), Schema.Unknown),
  Schema.Tuple(Schema.Literal("error"), Schema.String)
)

type Result = typeof Result.Type
// readonly ["ok", unknown] | readonly ["error", string]
```

## Mutable Arrays

For mutable arrays, use `Schema.mutable`:

```typescript
import { Schema } from "effect"

const MutableArray = Schema.mutable(Schema.Array(Schema.String))
// Schema<string[], string[], never>

type Mutable = typeof MutableArray.Type
// string[]  (not readonly!)
```

## Summary

| Schema | Description | Type |
|--------|-------------|------|
| `Array(s)` | Variable-length array | `readonly T[]` |
| `NonEmptyArray(s)` | At least one element | `readonly [T, ...T[]]` |
| `Tuple(a, b, c)` | Fixed-length tuple | `readonly [A, B, C]` |
| `optionalElement(s)` | Optional tuple element | `T?` |
| `element(s)` | Annotated element | - |
| `ArrayEnsure(s)` | Normalize to array | - |
| `minItems(n)` | Minimum length | - |
| `maxItems(n)` | Maximum length | - |
| `itemsCount(n)` | Exact length | - |

## Next Steps

- [Unions](/guide/unions) - Combining multiple schemas
- [Records](/guide/records) - Dynamic key-value objects
- [Filters](/guide/filters) - More validation rules

