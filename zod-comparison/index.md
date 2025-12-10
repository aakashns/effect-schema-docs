---
title: Zod Comparison
description: Compare Effect Schema with Zod - features, philosophy, and when to use each
---

# Effect Schema vs Zod

Both Effect Schema and [Zod](https://zod.dev) are excellent TypeScript validation libraries. This guide helps you understand the differences and choose the right tool for your needs.

## At a Glance

| Feature | Effect Schema | Zod |
|---------|---------------|-----|
| Type inference | ✅ Full | ✅ Full |
| Encoding (serialize) | ✅ Built-in | ❌ Not supported |
| Async validation | ✅ Effect-native | ✅ refine async |
| JSON Schema | ✅ Built-in | ⚠️ Plugin required |
| Property testing | ✅ Built-in | ⚠️ Plugin required |
| Effect integration | ✅ Native | ❌ None |
| Class support | ✅ Built-in | ❌ None |
| Branded types | ✅ Built-in | ✅ Built-in |
| Bundle size | ~15KB | ~12KB |
| Learning curve | Moderate | Easy |

## The Key Difference: Encoding

The biggest difference is that **Effect Schema is bidirectional**.

### Zod: Decode Only

```typescript
import { z } from "zod"

const UserSchema = z.object({
  name: z.string(),
  birthDate: z.coerce.date()  // string → Date
})

// ✅ Decode works
const user = UserSchema.parse({
  name: "Alice",
  birthDate: "1990-05-15"
})
// { name: "Alice", birthDate: Date }

// ❌ How do you serialize back?
JSON.stringify(user)  // birthDate becomes weird ISO string
// You have to manually handle serialization
```

### Effect Schema: Encode & Decode

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  birthDate: Schema.DateFromString
})

// ✅ Decode: string → Date
const user = Schema.decodeUnknownSync(User)({
  name: "Alice",
  birthDate: "1990-05-15"
})

// ✅ Encode: Date → string
const json = Schema.encodeSync(User)(user)
// { name: "Alice", birthDate: "1990-05-15T00:00:00.000Z" }
```

**Why this matters:**
- API responses: decode incoming, encode outgoing
- Database operations: transform both ways
- Forms: parse user input, serialize for storage
- No manual serialization code

## Feature Comparison

### Basic Schemas

::: code-group

```typescript [Zod]
import { z } from "zod"

const User = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

type User = z.infer<typeof User>
```

```typescript [Effect Schema]
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String.pipe(Schema.nonEmptyString()),
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  age: Schema.Number.pipe(Schema.int(), Schema.between(0, 150))
})

type User = typeof User.Type
```

:::

### Unions

::: code-group

```typescript [Zod]
const Shape = z.discriminatedUnion("type", [
  z.object({ type: z.literal("circle"), radius: z.number() }),
  z.object({ type: z.literal("rect"), width: z.number(), height: z.number() })
])
```

```typescript [Effect Schema]
const Shape = Schema.Union(
  Schema.Struct({ type: Schema.Literal("circle"), radius: Schema.Number }),
  Schema.Struct({ type: Schema.Literal("rect"), width: Schema.Number, height: Schema.Number })
)
```

:::

### Optional Fields

::: code-group

```typescript [Zod]
const User = z.object({
  name: z.string(),
  email: z.string().optional(),        // string | undefined
  phone: z.string().nullable(),        // string | null
  bio: z.string().nullish()            // string | null | undefined
})
```

```typescript [Effect Schema]
const User = Schema.Struct({
  name: Schema.String,
  email: Schema.optional(Schema.String),     // string | undefined
  phone: Schema.NullOr(Schema.String),       // string | null
  bio: Schema.NullishOr(Schema.String)       // string | null | undefined
})
```

:::

### Transformations

::: code-group

```typescript [Zod]
// Zod has limited transformation support
const Lower = z.string().transform(s => s.toLowerCase())

// But no inverse (encoding)!
```

```typescript [Effect Schema]
// Full bidirectional transformation
const Lower = Schema.transform(
  Schema.String,
  Schema.String,
  {
    decode: (s) => s.toLowerCase(),
    encode: (s) => s  // or s.toUpperCase() for inverse
  }
)
```

:::

### Default Values

::: code-group

```typescript [Zod]
const User = z.object({
  role: z.string().default("user"),
  active: z.boolean().default(true)
})
```

```typescript [Effect Schema]
const User = Schema.Struct({
  role: Schema.optional(Schema.String, { default: () => "user" }),
  active: Schema.optional(Schema.Boolean, { default: () => true })
})
```

:::

### Refinements

::: code-group

```typescript [Zod]
const Password = z.string()
  .min(8)
  .refine(s => /[A-Z]/.test(s), "Must contain uppercase")
  .refine(s => /[0-9]/.test(s), "Must contain number")
```

```typescript [Effect Schema]
const Password = Schema.String.pipe(
  Schema.minLength(8),
  Schema.pattern(/[A-Z]/, { message: () => "Must contain uppercase" }),
  Schema.pattern(/[0-9]/, { message: () => "Must contain number" })
)
```

:::

## Unique Effect Schema Features

### 1. Built-in JSON Schema Generation

```typescript
import { Schema, JSONSchema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  age: Schema.Number.pipe(Schema.int())
})

const jsonSchema = JSONSchema.make(User)
// {
//   type: "object",
//   properties: {
//     name: { type: "string" },
//     age: { type: "integer" }
//   },
//   required: ["name", "age"]
// }
```

### 2. Property-Based Testing

```typescript
import { Schema, Arbitrary } from "effect"
import * as fc from "fast-check"

const User = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1)),
  age: Schema.Number.pipe(Schema.int(), Schema.between(0, 150))
})

// Generate random valid users
const userArbitrary = Arbitrary.make(User)

fc.assert(fc.property(userArbitrary, (user) => {
  // user is always a valid User
  return user.age >= 0 && user.age <= 150
}))
```

### 3. Schema Classes

```typescript
import { Schema } from "effect"

class User extends Schema.Class<User>("User")({
  name: Schema.String,
  age: Schema.Number
}) {
  greet(): string {
    return `Hello, ${this.name}!`
  }
}

const user = new User({ name: "Alice", age: 30 })
user.greet()  // "Hello, Alice!"

// Also works as a schema
Schema.decodeUnknownSync(User)({ name: "Bob", age: 25 })
```

### 4. Effect Integration

```typescript
import { Schema } from "effect"
import { Effect } from "effect"

// Schema operations return Effects
const decode = Schema.decodeUnknown(User)(data)
// Effect<User, ParseError, never>

// Compose with other effects
const program = Effect.gen(function* () {
  const data = yield* fetchData()
  const user = yield* Schema.decodeUnknown(User)(data)
  yield* saveUser(user)
  return user
})
```

## Unique Zod Features

### 1. Simpler API

Zod has a flatter, more approachable API for simple use cases:

```typescript
// Zod - very concise
z.string().email().min(1)

// Effect Schema - more verbose
Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.minLength(1)
)
```

### 2. Built-in Email/URL Validators

```typescript
// Zod has built-in validators
z.string().email()
z.string().url()
z.string().uuid()

// Effect Schema uses patterns or brands
Schema.String.pipe(Schema.pattern(/email-regex/))
```

### 3. Error Formatting

Zod has built-in error formatting utilities:

```typescript
const result = UserSchema.safeParse(data)
if (!result.success) {
  const formatted = result.error.format()
  // { name: { _errors: ["Required"] }, ... }
}
```

Effect Schema uses TreeFormatter or ArrayFormatter:

```typescript
import { ParseResult } from "effect"

try {
  Schema.decodeUnknownSync(User)(data)
} catch (e) {
  if (ParseResult.isParseError(e)) {
    const formatted = ParseResult.ArrayFormatter.formatIssueSync(e.issue)
    // [{ path: ["name"], message: "Expected string" }, ...]
  }
}
```

## When to Choose Effect Schema

Choose Effect Schema when you need:

- **Bidirectional transformations** (encode + decode)
- **Effect ecosystem integration**
- **JSON Schema generation**
- **Property-based testing**
- **Schema classes**
- **Complex transformations**
- **Full-stack type safety** with shared schemas

## When to Choose Zod

Choose Zod when you need:

- **Simple validation** without encoding
- **Minimal learning curve**
- **Standalone usage** (no Effect dependency)
- **Rich ecosystem** of plugins
- **Simpler error messages**

## Migration Guide

Ready to migrate? See the [Migration Guide](/zod-comparison/migration) for step-by-step instructions.

