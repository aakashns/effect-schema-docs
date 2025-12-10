---
title: Schema Design Best Practices
description: Best practices for designing and organizing Effect Schema definitions
---

# Schema Design Best Practices

Learn how to write clean, maintainable, and performant schemas.

## Organize Your Schemas

### 1. Create a Schemas Directory

```
src/
├── schemas/
│   ├── index.ts        # Re-export all schemas
│   ├── user.ts         # User-related schemas
│   ├── order.ts        # Order-related schemas
│   ├── common.ts       # Shared schemas (Email, URL, etc.)
│   └── api/
│       ├── requests.ts
│       └── responses.ts
```

### 2. Co-export Types with Schemas

```typescript
// schemas/user.ts
import { Schema } from "effect"

export const UserSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String
})

// Export both schema and type
export type User = typeof UserSchema.Type
export type UserEncoded = typeof UserSchema.Encoded
```

### 3. Create Branded Primitives

```typescript
// schemas/common.ts
import { Schema } from "effect"

export const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("Email")
)
export type Email = typeof Email.Type

export const UserId = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.brand("UserId")
)
export type UserId = typeof UserId.Type

export const PositiveInt = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("PositiveInt")
)
export type PositiveInt = typeof PositiveInt.Type
```

## Design Principles

### 1. Prefer Composition over Repetition

```typescript
// ❌ Repetitive
const CreateUser = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  email: Schema.String.pipe(Schema.pattern(/email-regex/))
})

const UpdateUser = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  email: Schema.String.pipe(Schema.pattern(/email-regex/))
})

// ✅ Composed
const Name = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(100)
)

const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
)

const UserFields = {
  name: Name,
  email: Email
}

const CreateUser = Schema.Struct(UserFields)
const UpdateUser = Schema.partial(Schema.Struct(UserFields))
```

### 2. Make Invalid States Unrepresentable

```typescript
// ❌ Allows invalid states
const Order = Schema.Struct({
  status: Schema.Literal("pending", "shipped", "delivered"),
  shippedAt: Schema.optional(Schema.DateFromString),
  deliveredAt: Schema.optional(Schema.DateFromString),
  trackingNumber: Schema.optional(Schema.String)
})
// Can have deliveredAt without shippedAt!

// ✅ Invalid states are impossible
const PendingOrder = Schema.Struct({
  status: Schema.Literal("pending"),
  items: Schema.Array(OrderItem)
})

const ShippedOrder = Schema.Struct({
  status: Schema.Literal("shipped"),
  items: Schema.Array(OrderItem),
  shippedAt: Schema.DateFromString,
  trackingNumber: Schema.String
})

const DeliveredOrder = Schema.Struct({
  status: Schema.Literal("delivered"),
  items: Schema.Array(OrderItem),
  shippedAt: Schema.DateFromString,
  deliveredAt: Schema.DateFromString,
  trackingNumber: Schema.String
})

const Order = Schema.Union(PendingOrder, ShippedOrder, DeliveredOrder)
```

### 3. Use Discriminated Unions

```typescript
// ❌ Hard to work with
const Result = Schema.Union(
  Schema.Struct({ data: Schema.Unknown }),
  Schema.Struct({ error: Schema.String })
)
// How do you know which one you have?

// ✅ Easy to discriminate
const Result = Schema.Union(
  Schema.Struct({ 
    success: Schema.Literal(true), 
    data: Schema.Unknown 
  }),
  Schema.Struct({ 
    success: Schema.Literal(false), 
    error: Schema.String 
  })
)

// Or use TaggedStruct
const Success = Schema.TaggedStruct("Success", { data: Schema.Unknown })
const Failure = Schema.TaggedStruct("Failure", { error: Schema.String })
const Result = Schema.Union(Success, Failure)
```

### 4. Document with Annotations

```typescript
const User = Schema.Struct({
  id: Schema.String.annotations({
    description: "Unique user identifier (UUID v4)",
    examples: ["123e4567-e89b-12d3-a456-426614174000"]
  }),
  role: Schema.Literal("admin", "user", "guest").annotations({
    description: "User's permission level"
  })
}).annotations({
  identifier: "User",
  title: "User",
  description: "A registered user in the system"
})
```

## Validation Best Practices

### 1. Fail Fast in Development, Accumulate in Production

```typescript
// Development: stop at first error (easier debugging)
const devOptions = { errors: "first" } as const

// Production: collect all errors (better UX)
const prodOptions = { errors: "all" } as const

const options = process.env.NODE_ENV === "development" 
  ? devOptions 
  : prodOptions

Schema.decodeUnknownSync(UserSchema)(data, options)
```

### 2. Provide Helpful Error Messages

```typescript
const Password = Schema.String.pipe(
  Schema.minLength(8, {
    message: () => "Password must be at least 8 characters long"
  }),
  Schema.pattern(/[A-Z]/, {
    message: () => "Password must contain at least one uppercase letter"
  }),
  Schema.pattern(/[0-9]/, {
    message: () => "Password must contain at least one number"
  })
)
```

### 3. Validate at Boundaries

```typescript
// ✅ Validate at system boundaries
async function handleRequest(req: Request) {
  // Validate incoming data
  const body = Schema.decodeUnknownSync(CreateUserRequest)(await req.json())
  
  // Internal code can trust the data
  const user = await createUser(body)
  
  // Encode for response
  return new Response(
    JSON.stringify(Schema.encodeSync(UserResponse)(user))
  )
}

// ❌ Don't validate in internal functions
function calculateTotal(items: unknown[]) {  // Should be Item[]
  const validated = items.map(i => Schema.decodeUnknownSync(Item)(i))
  // ...
}
```

## Performance Tips

### 1. Cache Decoders

```typescript
// ❌ Creates new decoder every call
function parseUser(data: unknown) {
  return Schema.decodeUnknownSync(UserSchema)(data)
}

// ✅ Reuse decoder
const decodeUser = Schema.decodeUnknownSync(UserSchema)

function parseUser(data: unknown) {
  return decodeUser(data)
}
```

### 2. Use Appropriate Parse Options

```typescript
// Only check property names if security matters
Schema.decodeUnknownSync(schema)(data, {
  onExcessProperty: "ignore"  // Faster than "error"
})

// Skip property order preservation if not needed
Schema.decodeUnknownSync(schema)(data, {
  preserveKeyOrder: false  // Default, but explicit
})
```

### 3. Avoid Deep Nesting When Possible

```typescript
// ⚠️ Deeply nested - more validation overhead
const DeepSchema = Schema.Struct({
  a: Schema.Struct({
    b: Schema.Struct({
      c: Schema.Struct({
        value: Schema.String
      })
    })
  })
})

// ✅ Flatter when semantically appropriate
const FlatSchema = Schema.Struct({
  a_b_c_value: Schema.String
})
```

## Testing Schemas

### 1. Test Edge Cases

```typescript
import { describe, it, expect } from "vitest"
import { Schema } from "effect"
import { UserSchema } from "./schemas"

describe("UserSchema", () => {
  it("accepts valid data", () => {
    const result = Schema.decodeUnknownEither(UserSchema)({
      name: "Alice",
      age: 30
    })
    expect(Either.isRight(result)).toBe(true)
  })

  it("rejects empty name", () => {
    const result = Schema.decodeUnknownEither(UserSchema)({
      name: "",
      age: 30
    })
    expect(Either.isLeft(result)).toBe(true)
  })

  it("rejects negative age", () => {
    const result = Schema.decodeUnknownEither(UserSchema)({
      name: "Alice",
      age: -5
    })
    expect(Either.isLeft(result)).toBe(true)
  })
})
```

### 2. Use Property-Based Testing

```typescript
import { Schema, Arbitrary } from "effect"
import * as fc from "fast-check"

describe("UserSchema roundtrip", () => {
  const userArbitrary = Arbitrary.make(UserSchema)

  it("decode ∘ encode = identity", () => {
    fc.assert(fc.property(userArbitrary, (user) => {
      const encoded = Schema.encodeSync(UserSchema)(user)
      const decoded = Schema.decodeSync(UserSchema)(encoded)
      expect(decoded).toEqual(user)
    }))
  })
})
```

### 3. Test Transformations Both Ways

```typescript
describe("DateFromString", () => {
  it("decodes ISO string to Date", () => {
    const date = Schema.decodeSync(Schema.DateFromString)("2024-01-15T10:30:00Z")
    expect(date).toBeInstanceOf(Date)
    expect(date.getFullYear()).toBe(2024)
  })

  it("encodes Date to ISO string", () => {
    const date = new Date("2024-01-15T10:30:00Z")
    const encoded = Schema.encodeSync(Schema.DateFromString)(date)
    expect(encoded).toBe("2024-01-15T10:30:00.000Z")
  })
})
```

## Summary

1. **Organize**: Keep schemas in dedicated files, co-export types
2. **Compose**: Build complex schemas from simple, reusable parts
3. **Type Safety**: Use brands, discriminated unions, and make invalid states impossible
4. **Document**: Add annotations for API docs and clarity
5. **Validate Smart**: At boundaries, with helpful messages
6. **Optimize**: Cache decoders, use appropriate options
7. **Test**: Edge cases, roundtrips, property tests

## Next Steps

- [Performance](/best-practices/performance) - Optimization tips
- [Testing](/best-practices/testing) - Testing strategies

