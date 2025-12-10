---
title: Core Concepts
description: Understand the fundamental concepts behind Effect Schema - Type, Encoded, transformations, and the parsing model
---

# Core Concepts

Before diving deeper into Effect Schema, it's important to understand the core concepts that make it unique. This page covers the foundational ideas you'll use throughout.

## The Schema Type

Every schema in Effect Schema has three type parameters:

```typescript
Schema<Type, Encoded, Context>
```

| Parameter | Description |
|-----------|-------------|
| `Type` (A) | Your application's internal representation |
| `Encoded` (I) | The external/serialized representation |
| `Context` (R) | Effect dependencies (usually `never`) |

### Type vs Encoded

This duality is what makes Schema special. Consider a date:

```typescript
import { Schema } from "effect"

const MyDate = Schema.DateFromString
// Schema<Date, string, never>
//         ↑     ↑
//        Type  Encoded
```

- **Type** (`Date`): What your code works with—a JavaScript Date object
- **Encoded** (`string`): What gets serialized—an ISO date string

When there's no transformation, Type and Encoded are the same:

```typescript
const MyString = Schema.String
// Schema<string, string, never>
//         ↑        ↑
//   Type and Encoded are both string
```

### Why This Matters

This design enables:

1. **Decode**: Transform external data → internal types
2. **Encode**: Transform internal types → external data

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  birthDate: Schema.DateFromString
})

// Type: { name: string, birthDate: Date }
// Encoded: { name: string, birthDate: string }

// Decode: JSON → User
const user = Schema.decodeSync(User)({
  name: "Alice",
  birthDate: "1990-05-15T00:00:00Z"
})
// user.birthDate is a Date object

// Encode: User → JSON
const json = Schema.encodeSync(User)(user)
// json.birthDate is "1990-05-15T00:00:00.000Z"
```

## The Three Operations

Schema provides three main operations: **decode**, **encode**, and **validate**.

### Decoding

Decoding transforms data from the **Encoded** type to the **Type**:

```
Encoded → Type
string  → Date (for DateFromString)
JSON    → Rich objects
```

```typescript
import { Schema } from "effect"

const MySchema = Schema.DateFromString

// decodeUnknown: accepts unknown, returns Type
const date = Schema.decodeUnknownSync(MySchema)("2024-01-15")
// date: Date

// decode: accepts Encoded, returns Type (stricter input type)
const date2 = Schema.decodeSync(MySchema)("2024-01-15")
// date2: Date
```

### Encoding

Encoding transforms data from **Type** back to **Encoded**:

```
Type → Encoded
Date → string (for DateFromString)
```

```typescript
import { Schema } from "effect"

const MySchema = Schema.DateFromString

const isoString = Schema.encodeSync(MySchema)(new Date())
// isoString: string
```

### Validation

Validation checks if an `unknown` value matches the **Type** without transformation:

```typescript
import { Schema } from "effect"

const NumberSchema = Schema.Number

// validate: checks if unknown matches Type
const num = Schema.validateSync(NumberSchema)(42)
// num: number

// is: returns boolean type guard
const isNumber = Schema.is(NumberSchema)
isNumber(42)    // true
isNumber("42")  // false
```

::: tip When to use validation vs decoding
Use **validation** when you expect data to already be in the correct Type format and just need to check it. Use **decoding** when you're receiving external data that needs transformation.
:::

## Operation Variants

Each operation comes in multiple variants for different use cases:

### By Return Type

| Function | Returns | Use When |
|----------|---------|----------|
| `decodeUnknownSync` | `Type` (throws on error) | Quick scripts, trusted data |
| `decodeUnknownEither` | `Either<Type, ParseError>` | Functional error handling |
| `decodeUnknownOption` | `Option<Type>` | When you just need success/failure |
| `decodeUnknownPromise` | `Promise<Type>` | Async contexts |
| `decodeUnknown` | `Effect<Type, ParseError, R>` | Full Effect integration |

### Unknown vs Typed Input

| Function | Input Type | Use When |
|----------|------------|----------|
| `decodeUnknownSync` | `unknown` | External data (API responses, JSON) |
| `decodeSync` | `Encoded` | Internal transformations |

```typescript
import { Schema } from "effect"

const MySchema = Schema.DateFromString
// Schema<Date, string>

// decodeUnknownSync accepts unknown
Schema.decodeUnknownSync(MySchema)("2024-01-15")  // ✅
Schema.decodeUnknownSync(MySchema)(123)           // Runtime error

// decodeSync accepts string (the Encoded type)
Schema.decodeSync(MySchema)("2024-01-15")         // ✅
// Schema.decodeSync(MySchema)(123)               // TypeScript error!
```

## Transformations

Transformations are the heart of Schema. They define how to convert between Encoded and Type.

### Built-in Transformations

Schema includes many built-in transformations:

```typescript
import { Schema } from "effect"

// String ↔ Number
const num = Schema.decodeSync(Schema.NumberFromString)("42")
// num: 42 (number)

// String ↔ Date
const date = Schema.decodeSync(Schema.DateFromString)("2024-01-15")
// date: Date object

// String ↔ Boolean
const bool = Schema.decodeSync(Schema.BooleanFromString)("true")
// bool: true (boolean)

// JSON String ↔ Object
const JsonUser = Schema.parseJson(Schema.Struct({
  name: Schema.String
}))
const user = Schema.decodeSync(JsonUser)('{"name": "Alice"}')
// user: { name: "Alice" }
```

### Custom Transformations

Create your own with `transform` or `transformOrFail`:

```typescript
import { Schema, ParseResult } from "effect"

// Simple transform (always succeeds)
const Reversed = Schema.transform(
  Schema.String,
  Schema.String,
  {
    decode: (s) => s.split("").reverse().join(""),
    encode: (s) => s.split("").reverse().join("")
  }
)

// Transform that can fail
const ParsedInt = Schema.transformOrFail(
  Schema.String,
  Schema.Number,
  {
    decode: (s, _, ast) => {
      const n = parseInt(s, 10)
      return isNaN(n)
        ? ParseResult.fail(new ParseResult.Type(ast, s))
        : ParseResult.succeed(n)
    },
    encode: (n) => ParseResult.succeed(String(n))
  }
)
```

## Refinements (Filters)

Refinements add validation rules without changing the type:

```typescript
import { Schema } from "effect"

const PositiveNumber = Schema.Number.pipe(
  Schema.positive()
)
// Schema<number, number, never>
// Type and Encoded are the same, but decode will fail for non-positive numbers

Schema.decodeSync(PositiveNumber)(5)   // ✅ 5
Schema.decodeSync(PositiveNumber)(-1)  // ❌ ParseError
```

Refinements are applied during decoding and encoding, ensuring data integrity in both directions.

### Multiple Refinements

Chain multiple refinements:

```typescript
import { Schema } from "effect"

const ValidAge = Schema.Number.pipe(
  Schema.int(),           // Must be integer
  Schema.between(0, 150)  // Must be between 0 and 150
)
```

## Composition

Schemas compose naturally. Complex schemas are built from simpler ones:

```typescript
import { Schema } from "effect"

// Base schemas
const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
)

const PhoneNumber = Schema.String.pipe(
  Schema.pattern(/^\+?[\d\s-]{10,}$/)
)

// Composed into larger structures
const ContactInfo = Schema.Struct({
  email: Email,
  phone: Schema.optional(PhoneNumber)
})

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  contact: ContactInfo
})

// Further composition
const Team = Schema.Struct({
  name: Schema.String,
  members: Schema.NonEmptyArray(User)
})
```

## The Context Parameter

The third type parameter, `Context` (R), represents Effect dependencies. For most schemas, this is `never`:

```typescript
const MySchema = Schema.String
// Schema<string, string, never>
//                        ↑ no dependencies
```

Context becomes non-`never` when you use effectful transformations or filters:

```typescript
import { Schema } from "effect"
import { Effect, Context } from "effect"

class Database extends Context.Tag("Database")<Database, {
  userExists: (email: string) => Effect.Effect<boolean>
}>() {}

const UniqueEmail = Schema.String.pipe(
  Schema.filterEffect((email) =>
    Effect.gen(function* () {
      const db = yield* Database
      const exists = yield* db.userExists(email)
      return !exists
    })
  )
)
// Schema<string, string, Database>
//                        ↑ requires Database service
```

## Understanding Parse Errors

When decoding fails, Schema provides detailed error information:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})

try {
  Schema.decodeUnknownSync(User)({
    name: 123,
    age: "thirty"
  })
} catch (error) {
  console.log(String(error))
}
// { readonly name: string; readonly age: number }
// ├─ ["name"]
// │  └─ Expected string, actual 123
// └─ ["age"]
//    └─ Expected number, actual "thirty"
```

Errors include:
- The expected type
- The actual value received  
- The path to the failing property
- Multiple errors when using `{ errors: "all" }` option

## Summary

| Concept | Description |
|---------|-------------|
| **Type** | Your application's internal representation |
| **Encoded** | The external/serialized representation |
| **Decode** | Encoded → Type (external → internal) |
| **Encode** | Type → Encoded (internal → external) |
| **Validate** | Check if unknown matches Type |
| **Transform** | Define Encoded ↔ Type conversion |
| **Refinement** | Add validation without changing type |
| **Composition** | Build complex schemas from simple ones |

## Next Steps

Now that you understand the fundamentals:

- [Primitives](/guide/primitives) - Learn about basic schema types
- [Structs](/guide/structs) - Define object schemas
- [Transformations](/guide/transformations) - Create custom transformations

