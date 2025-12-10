---
title: Quick Start
description: Get up and running with Effect Schema in 5 minutes
---

# Quick Start

Let's build something real with Effect Schema. In this guide, you'll learn to define schemas, validate data, and handle errors.

## Your First Schema

Let's create a schema for a user profile:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  age: Schema.Number
})
```

This creates a schema that expects an object with four properties. TypeScript automatically infers the type:

```typescript
type User = typeof User.Type
// {
//   readonly id: string
//   readonly name: string
//   readonly email: string
//   readonly age: number
// }
```

## Decoding Data

"Decoding" means taking unknown data and validating it against your schema:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  age: Schema.Number
})

// ✅ Valid data
const user = Schema.decodeUnknownSync(User)({
  id: "1",
  name: "Alice",
  email: "alice@example.com",
  age: 30
})

console.log(user)
// { id: '1', name: 'Alice', email: 'alice@example.com', age: 30 }
```

If the data is invalid, Schema throws a descriptive error:

```typescript
// ❌ Invalid data - age is a string, not a number
Schema.decodeUnknownSync(User)({
  id: "1",
  name: "Alice",
  email: "alice@example.com",
  age: "thirty" // Wrong type!
})
// Throws: ParseError: { readonly id: string; readonly name: string; readonly email: string; readonly age: number }
// └─ ["age"]
//    └─ Expected number, actual "thirty"
```

## Adding Validation Rules

Let's add validation rules (called "filters") to our schema:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String.pipe(Schema.nonEmptyString()),
  name: Schema.String.pipe(
    Schema.minLength(2),
    Schema.maxLength(100)
  ),
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  ),
  age: Schema.Number.pipe(
    Schema.int(),
    Schema.between(0, 150)
  )
})

// Now validation is more strict
Schema.decodeUnknownSync(User)({
  id: "",                    // ❌ Must be non-empty
  name: "A",                 // ❌ Must be at least 2 characters
  email: "not-an-email",     // ❌ Must match email pattern
  age: -5                    // ❌ Must be between 0 and 150
})
```

## Different Ways to Decode

Schema offers multiple decoding functions depending on your needs:

### Sync (throws on error)

```typescript
// Throws ParseError if invalid
const user = Schema.decodeUnknownSync(User)(data)
```

### Sync (returns Either)

```typescript
import { Either } from "effect"

const result = Schema.decodeUnknownEither(User)(data)

if (Either.isRight(result)) {
  console.log("Valid:", result.right)
} else {
  console.log("Invalid:", result.left)
}
```

### Promise

```typescript
const user = await Schema.decodeUnknownPromise(User)(data)
```

### Effect

```typescript
import { Effect } from "effect"

const program = Schema.decodeUnknown(User)(data)
// Effect<User, ParseError, never>

Effect.runSync(program) // Or runPromise, etc.
```

## Encoding Data

Encoding is the reverse of decoding—converting your internal types back to external formats:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  createdAt: Schema.DateFromString  // Date ↔ string transformation
})

// Create a user with a Date object
const user = {
  id: "1",
  name: "Alice",
  createdAt: new Date("2024-01-15")
}

// Encode back to a serializable format
const encoded = Schema.encodeSync(User)(user)
console.log(encoded)
// { id: '1', name: 'Alice', createdAt: '2024-01-15T00:00:00.000Z' }
```

## Type Guards (is)

Create type guard functions for runtime checking:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})

const isUser = Schema.is(User)

const data: unknown = { name: "Alice", age: 30 }

if (isUser(data)) {
  // TypeScript knows `data` is User here
  console.log(data.name.toUpperCase())
}
```

## Assertions (asserts)

Create assertion functions that throw if data is invalid:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})

const assertUser = Schema.asserts(User)

function processUser(data: unknown) {
  assertUser(data)
  // After this line, TypeScript knows `data` is User
  console.log(data.name.toUpperCase())
}
```

## Optional Fields

Make fields optional with `Schema.optional`:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  nickname: Schema.optional(Schema.String)  // string | undefined
})

type User = typeof User.Type
// {
//   readonly id: string
//   readonly name: string
//   readonly nickname?: string | undefined
// }

// Both are valid:
Schema.decodeUnknownSync(User)({ id: "1", name: "Alice" })
Schema.decodeUnknownSync(User)({ id: "1", name: "Alice", nickname: "Ali" })
```

## Union Types

Handle multiple possible types:

```typescript
import { Schema } from "effect"

// Simple union
const StringOrNumber = Schema.Union(Schema.String, Schema.Number)

// Discriminated union (recommended for objects)
const Shape = Schema.Union(
  Schema.Struct({
    type: Schema.Literal("circle"),
    radius: Schema.Number
  }),
  Schema.Struct({
    type: Schema.Literal("rectangle"),
    width: Schema.Number,
    height: Schema.Number
  })
)

type Shape = typeof Shape.Type
// | { readonly type: "circle"; readonly radius: number }
// | { readonly type: "rectangle"; readonly width: number; readonly height: number }
```

## Arrays

Define array schemas:

```typescript
import { Schema } from "effect"

const Numbers = Schema.Array(Schema.Number)

const Users = Schema.Array(
  Schema.Struct({
    name: Schema.String,
    age: Schema.Number
  })
)

// With validation
const NonEmptyNumbers = Schema.NonEmptyArray(Schema.Number)
const LimitedNumbers = Schema.Array(Schema.Number).pipe(
  Schema.minItems(1),
  Schema.maxItems(10)
)
```

## Complete Example

Here's a more complete example putting it all together:

```typescript
import { Schema } from "effect"
import { Either } from "effect"

// Define schemas
const Address = Schema.Struct({
  street: Schema.String,
  city: Schema.String,
  zipCode: Schema.String.pipe(Schema.pattern(/^\d{5}(-\d{4})?$/))
})

const User = Schema.Struct({
  id: Schema.String.pipe(Schema.nonEmptyString()),
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  name: Schema.String.pipe(Schema.minLength(2), Schema.maxLength(100)),
  age: Schema.Number.pipe(Schema.int(), Schema.between(0, 150)),
  role: Schema.Literal("admin", "user", "guest"),
  address: Schema.optional(Address),
  tags: Schema.Array(Schema.String),
  createdAt: Schema.DateFromString
})

type User = typeof User.Type

// Parse API response
function parseUser(json: string): Either.Either<User, Error> {
  try {
    const data = JSON.parse(json)
    return Schema.decodeUnknownEither(User)(data).pipe(
      Either.mapLeft((error) => new Error(String(error)))
    )
  } catch (e) {
    return Either.left(e instanceof Error ? e : new Error(String(e)))
  }
}

// Usage
const result = parseUser(`{
  "id": "123",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "age": 30,
  "role": "admin",
  "tags": ["developer", "team-lead"],
  "createdAt": "2024-01-15T10:30:00Z"
}`)

if (Either.isRight(result)) {
  const user = result.right
  console.log(`User: ${user.name}`)
  console.log(`Created: ${user.createdAt.toLocaleDateString()}`) // createdAt is a Date!
}
```

## Next Steps

You now know the basics of Effect Schema! Continue learning:

- [Core Concepts](/guide/core-concepts) - Understand Type vs Encoded and transformations
- [Primitives](/guide/primitives) - All primitive schema types
- [Structs](/guide/structs) - Deep dive into object schemas
- [Filters](/guide/filters) - All built-in validation rules

