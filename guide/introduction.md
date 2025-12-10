---
title: What is Effect Schema?
description: Learn about Effect Schema, a powerful library for type-safe data validation, transformation, and serialization in TypeScript.
---

# What is Effect Schema?

Effect Schema is a TypeScript library for defining the **structure**, **validation rules**, and **transformations** of your data. It's part of the [Effect](https://effect.website) ecosystem but can be used completely standalone.

## The Problem Schema Solves

Modern applications deal with data from many sources: APIs, databases, user input, configuration files, message queues. This data comes in as "unknown" values—TypeScript can't guarantee its shape at compile time.

The traditional approach has problems:

```typescript
// ❌ Unsafe: TypeScript trusts you, runtime doesn't
const user = JSON.parse(apiResponse) as User

// ❌ Manual validation is tedious and error-prone
function validateUser(data: unknown): User {
  if (typeof data !== "object" || data === null) throw new Error("Invalid")
  if (typeof (data as any).name !== "string") throw new Error("Invalid name")
  if (typeof (data as any).age !== "number") throw new Error("Invalid age")
  // ... dozens more checks for complex types
  return data as User
}
```

Schema provides a better way:

```typescript
import { Schema } from "effect"

// ✅ Define structure and validation together
const User = Schema.Struct({
  name: Schema.String,
  age: Schema.Number.pipe(Schema.int(), Schema.positive())
})

// ✅ Type is automatically inferred
type User = typeof User.Type

// ✅ Safe parsing with detailed errors
const user = Schema.decodeUnknownSync(User)(JSON.parse(apiResponse))
```

## Key Features

### 1. Bidirectional Transformations

Unlike validation-only libraries, Schema handles both **decoding** (external → internal) and **encoding** (internal → external):

```typescript
import { Schema } from "effect"

// This schema represents:
// - Type (internal): Date object
// - Encoded (external): ISO date string
const DateSchema = Schema.DateFromString

// Decode: "2024-01-15" → Date
const date = Schema.decodeSync(DateSchema)("2024-01-15T10:30:00Z")

// Encode: Date → "2024-01-15T10:30:00.000Z"
const isoString = Schema.encodeSync(DateSchema)(date)
```

This is invaluable for:
- API serialization (objects → JSON → objects)
- Database operations (rich types → primitives → rich types)
- Form handling (strings → typed values → strings)

### 2. Full Type Inference

Schema automatically infers TypeScript types from your definitions:

```typescript
import { Schema } from "effect"

const Product = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  price: Schema.Number,
  inStock: Schema.Boolean,
  tags: Schema.Array(Schema.String),
  metadata: Schema.optional(Schema.Record({ 
    key: Schema.String, 
    value: Schema.Unknown 
  }))
})

// No need to write this type manually—it's derived
type Product = typeof Product.Type
/*
{
  readonly id: string
  readonly name: string
  readonly price: number
  readonly inStock: boolean
  readonly tags: readonly string[]
  readonly metadata?: { readonly [x: string]: unknown } | undefined
}
*/
```

### 3. Composable Design

Schemas are composable building blocks. Start simple, combine to build complex structures:

```typescript
import { Schema } from "effect"

// Simple schemas
const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("Email")
)

const UserId = Schema.String.pipe(Schema.brand("UserId"))

// Composed schemas
const Address = Schema.Struct({
  street: Schema.String,
  city: Schema.String,
  country: Schema.String,
  postalCode: Schema.String
})

const User = Schema.Struct({
  id: UserId,
  email: Email,
  addresses: Schema.Array(Address)
})

// Further composition
const Team = Schema.Struct({
  name: Schema.String,
  members: Schema.Array(User)
})
```

### 4. Rich Validation

Built-in filters for common validations, plus easy custom validation:

```typescript
import { Schema } from "effect"

const RegistrationForm = Schema.Struct({
  username: Schema.String.pipe(
    Schema.minLength(3),
    Schema.maxLength(20),
    Schema.pattern(/^[a-zA-Z0-9_]+$/)
  ),
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  password: Schema.String.pipe(Schema.minLength(8)),
  age: Schema.Number.pipe(
    Schema.int(),
    Schema.between(13, 120)
  ),
  website: Schema.optional(Schema.String.pipe(Schema.startsWith("https://")))
})
```

### 5. Effect Integration (Optional)

Schema integrates seamlessly with Effect for advanced use cases:

```typescript
import { Schema } from "effect"
import { Effect } from "effect"

// Async validation with effects
const UserWithDbCheck = Schema.Struct({
  email: Schema.String
}).pipe(
  Schema.filterEffect((user) =>
    Effect.gen(function* () {
      const exists = yield* checkEmailExists(user.email)
      return !exists
    })
  )
)

// Decode returns an Effect
const result = Schema.decodeUnknown(UserWithDbCheck)(data)
// Effect<User, ParseError, DatabaseService>
```

But you can use Schema without any Effect knowledge using sync/promise APIs.

## When to Use Schema

Schema is ideal when you need to:

- **Validate API inputs/outputs** with full type safety
- **Transform data** between different representations
- **Serialize/deserialize** complex types (dates, branded types, etc.)
- **Generate JSON Schema** for API documentation
- **Property-test** your data types
- **Work with the Effect ecosystem** for advanced error handling

## Schema vs. Other Libraries

| Feature | Effect Schema | Zod | io-ts | Yup |
|---------|---------------|-----|-------|-----|
| Type inference | ✅ | ✅ | ✅ | ⚠️ |
| Encoding (reverse) | ✅ | ❌ | ✅ | ❌ |
| Effect integration | ✅ | ❌ | ⚠️ | ❌ |
| JSON Schema gen | ✅ | Plugin | ⚠️ | Plugin |
| Property testing | ✅ | Plugin | Plugin | ❌ |
| Class support | ✅ | ❌ | ❌ | ❌ |
| Branded types | ✅ | ✅ | ✅ | ❌ |

See the [Zod Comparison](/zod-comparison/) for a detailed comparison.

## Core Philosophy

Effect Schema follows these principles:

1. **Type safety first**: If it compiles, the runtime behavior matches
2. **Bidirectional by default**: Transformations should work both ways
3. **Composable**: Small schemas combine into larger ones
4. **Extensible**: Custom types, validations, and transformations
5. **Ecosystem integration**: Works with JSON Schema, fast-check, and Effect

## Next Steps

Ready to get started?

1. [Install Schema](/guide/installation) in your project
2. Follow the [Quick Start](/guide/quick-start) tutorial
3. Learn the [Core Concepts](/guide/core-concepts)

Or jump directly to what you need:
- [Defining Schemas](/guide/primitives) - Start with the basics
- [Transformations](/guide/transformations) - Learn about encode/decode
- [Coming from Zod?](/zod-comparison/migration) - Migration guide

