---
title: FAQ
description: Frequently asked questions about Effect Schema
---

# Frequently Asked Questions

## General

### What is Effect Schema?

Effect Schema is a TypeScript library for defining data structures, validation rules, and transformations. It's part of the Effect ecosystem but can be used standalone.

### Do I need to learn Effect to use Schema?

No! While Schema is part of the Effect ecosystem, you can use it completely standalone with sync/promise APIs:

```typescript
import { Schema } from "effect"

// No Effect knowledge needed
const User = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})

const user = Schema.decodeUnknownSync(User)(data)
```

### How does Schema compare to Zod?

See our detailed [Zod Comparison](/zod-comparison/) and [Migration Guide](/zod-comparison/migration).

Key differences:
- Schema supports **encoding** (reverse of decoding)
- Schema has **built-in JSON Schema** generation
- Schema has **property testing** support
- Schema integrates with **Effect** for advanced use cases

### Is Schema production-ready?

Yes! Schema is used in production by many companies. It has:
- Comprehensive test coverage
- Active maintenance
- Semantic versioning
- TypeScript strict mode support

## Usage

### How do I validate data?

Use `decodeUnknownSync` for the simplest case:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})

try {
  const user = Schema.decodeUnknownSync(User)(data)
  // user is valid
} catch (error) {
  // Handle validation error
}
```

### How do I get all errors instead of just the first?

Use the `errors: "all"` option:

```typescript
Schema.decodeUnknownSync(User)(data, { errors: "all" })
```

### How do I handle optional fields?

Use `Schema.optional`:

```typescript
const User = Schema.Struct({
  name: Schema.String,
  email: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String, { default: () => "N/A" })
})
```

### How do I transform data (e.g., string to Date)?

Use built-in transformations or create custom ones:

```typescript
import { Schema } from "effect"

// Built-in
const User = Schema.Struct({
  createdAt: Schema.DateFromString  // string → Date
})

// Custom
const Reversed = Schema.transform(
  Schema.String,
  Schema.String,
  {
    decode: (s) => s.split("").reverse().join(""),
    encode: (s) => s.split("").reverse().join("")
  }
)
```

### What's the difference between decode and validate?

- **Decode**: Transforms data from Encoded type to Type (e.g., string → Date)
- **Validate**: Checks if data matches the Type without transformation

```typescript
// Decode: string → Date
Schema.decodeSync(Schema.DateFromString)("2024-01-15")  // Date

// Validate: checks if input is already a Date
Schema.validateSync(Schema.DateFromSelf)(new Date())  // Date
```

### How do I encode data back?

Use the `encode` functions:

```typescript
const User = Schema.Struct({
  name: Schema.String,
  createdAt: Schema.DateFromString
})

const user = { name: "Alice", createdAt: new Date() }
const json = Schema.encodeSync(User)(user)
// { name: "Alice", createdAt: "2024-01-15T..." }
```

## Type System

### How do I get the TypeScript type from a schema?

Use `typeof Schema.Type`:

```typescript
const UserSchema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})

type User = typeof UserSchema.Type
// { readonly name: string; readonly age: number }
```

### What's the difference between Type and Encoded?

- **Type**: Your application's internal representation
- **Encoded**: The external/serialized representation

```typescript
const User = Schema.Struct({
  createdAt: Schema.DateFromString
})

type User = typeof User.Type
// { readonly createdAt: Date }

type UserEncoded = typeof User.Encoded
// { readonly createdAt: string }
```

### Why are properties readonly?

Schema defaults to readonly properties to encourage immutability. Use `Schema.mutable` if you need mutable types:

```typescript
const MutableUser = Schema.mutable(Schema.Struct({
  name: Schema.String
}))

type MutableUser = typeof MutableUser.Type
// { name: string }  // Not readonly!
```

### How do I create branded types?

Use `Schema.brand`:

```typescript
const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type
// string & Brand<"UserId">
```

## Errors

### How do I customize error messages?

Use the `message` annotation:

```typescript
Schema.String.pipe(
  Schema.minLength(8, {
    message: () => "Must be at least 8 characters"
  })
)
```

### How do I format errors for display?

Use `ArrayFormatter` or `TreeFormatter`:

```typescript
import { Schema, ParseResult } from "effect"

try {
  Schema.decodeUnknownSync(User)(data)
} catch (e) {
  if (ParseResult.isParseError(e)) {
    // Array format (for forms)
    const errors = ParseResult.ArrayFormatter.formatIssueSync(e.issue)
    // [{ path: ["name"], message: "Expected string" }]
    
    // Tree format (for logging)
    const tree = ParseResult.TreeFormatter.formatIssueSync(e.issue)
    // "{ name: ... }\n└─ Expected string"
  }
}
```

## Performance

### Is Schema fast?

Yes! Schema is designed for performance:
- Minimal allocations
- Early exit on first error (configurable)
- No reflection or eval
- Tree-shakeable

### Should I cache decoders?

Yes, it's a good practice:

```typescript
// ✅ Good: decoder created once
const decodeUser = Schema.decodeUnknownSync(User)

function parseUser(data: unknown) {
  return decodeUser(data)
}
```

## Integration

### Does Schema work with React?

Yes! Schema works great with React:
- Form validation with react-hook-form
- API response parsing
- State validation

### Does Schema work with Next.js?

Yes! Schema works with both client and server components. For server actions:

```typescript
"use server"

async function createUser(formData: FormData) {
  const data = Object.fromEntries(formData)
  const user = Schema.decodeUnknownSync(CreateUserSchema)(data)
  // ...
}
```

### Can I use Schema with OpenAPI?

Yes! Generate JSON Schema and use it in your OpenAPI spec:

```typescript
import { Schema, JSONSchema } from "effect"

const userJsonSchema = JSONSchema.make(UserSchema)

// Use in OpenAPI spec
const openApi = {
  components: {
    schemas: {
      User: userJsonSchema
    }
  }
}
```

## Need More Help?

- [GitHub Issues](https://github.com/Effect-TS/effect/issues) - Bug reports and questions
- [Discord](https://discord.gg/effect-ts) - Community chat
- [Effect Website](https://effect.website) - Full documentation

