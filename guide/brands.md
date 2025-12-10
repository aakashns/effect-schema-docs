---
title: Brands
description: Learn how to use branded types in Effect Schema for type-safe domain modeling
---

# Brands

Brands add "nominal typing" to TypeScript's structural type system. They help you distinguish between values that have the same underlying type but different semantic meanings.

## The Problem Brands Solve

Consider this code:

```typescript
// Both are strings, but they're not interchangeable!
type UserId = string
type OrderId = string

function getOrder(orderId: OrderId): Order { /* ... */ }

const userId: UserId = "user_123"
getOrder(userId)  // ✅ TypeScript allows this - but it's wrong!
```

TypeScript uses structural typing, so `UserId` and `OrderId` are indistinguishable. Brands fix this:

```typescript
import { Schema, Brand } from "effect"

const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type // string & Brand<"UserId">

const OrderId = Schema.String.pipe(Schema.brand("OrderId"))
type OrderId = typeof OrderId.Type // string & Brand<"OrderId">

function getOrder(orderId: OrderId): Order { /* ... */ }

const userId = Schema.decodeSync(UserId)("user_123")
getOrder(userId)  // ❌ TypeScript error! Type 'Brand<"UserId">' not assignable
```

## Creating Branded Types

### Basic Brand

```typescript
import { Schema } from "effect"

const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("Email")
)

type Email = typeof Email.Type
// string & Brand<"Email">

// Create branded values
const email = Schema.decodeSync(Email)("alice@example.com")
// email has type: string & Brand<"Email">

// Use with regular strings
const regular = "hello"
const branded: Email = regular  // ❌ Type error!
```

### With Validation

Brands work with any schema, including those with filters:

```typescript
import { Schema } from "effect"

const PositiveInt = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("PositiveInt")
)

type PositiveInt = typeof PositiveInt.Type
// number & Brand<"PositiveInt">

// Validation + branding
Schema.decodeSync(PositiveInt)(42)    // ✅ 42 as PositiveInt
Schema.decodeSync(PositiveInt)(-5)    // ❌ ParseError: not positive
Schema.decodeSync(PositiveInt)(3.14)  // ❌ ParseError: not integer
```

### Symbol Brands

Use symbols for brands that shouldn't conflict:

```typescript
import { Schema } from "effect"

const UserIdSymbol = Symbol.for("UserId")
const UserId = Schema.String.pipe(Schema.brand(UserIdSymbol))

type UserId = typeof UserId.Type
// string & Brand<typeof UserIdSymbol>
```

## Brand Schema Interface

Branded schemas provide a `make` function:

```typescript
import { Schema } from "effect"

const UserId = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.brand("UserId")
)

// make() validates and brands
const id1 = UserId.make("user_123")  // ✅ Validates

// Skip validation (use carefully!)
const id2 = UserId.make("", { disableValidation: true })  // No validation
```

## Multiple Brands

Stack multiple brands on the same value:

```typescript
import { Schema } from "effect"

const PositiveInt = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("PositiveInt")
)

const UserId = PositiveInt.pipe(
  Schema.brand("UserId")
)

type UserId = typeof UserId.Type
// number & Brand<"PositiveInt"> & Brand<"UserId">
```

## fromBrand with Effect's Brand

Use with Effect's `Brand` module for more control:

```typescript
import { Schema, Brand } from "effect"

// Define brand constructor with Effect's Brand
type UserId = string & Brand.Brand<"UserId">
const UserId = Brand.nominal<UserId>()

// Create schema from brand
const UserIdSchema = Schema.String.pipe(Schema.fromBrand(UserId))

// Now you can use both:
const id1 = UserId.make("user_123")              // Using Brand directly
const id2 = Schema.decodeSync(UserIdSchema)("user_123")  // Using Schema
```

## Practical Examples

### Domain Identifiers

```typescript
import { Schema } from "effect"

// Database IDs
const UserId = Schema.String.pipe(Schema.brand("UserId"))
const OrderId = Schema.String.pipe(Schema.brand("OrderId"))
const ProductId = Schema.String.pipe(Schema.brand("ProductId"))

// Composite types use the brands
const Order = Schema.Struct({
  id: OrderId,
  userId: UserId,
  products: Schema.Array(Schema.Struct({
    productId: ProductId,
    quantity: Schema.Number.pipe(Schema.int(), Schema.positive())
  }))
})
```

### Validated Strings

```typescript
import { Schema } from "effect"

const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("Email")
)

const PhoneNumber = Schema.String.pipe(
  Schema.pattern(/^\+?[\d\s-]{10,}$/),
  Schema.brand("PhoneNumber")
)

const Url = Schema.String.pipe(
  Schema.pattern(/^https?:\/\/.+/),
  Schema.brand("Url")
)

const User = Schema.Struct({
  email: Email,
  phone: Schema.optional(PhoneNumber),
  website: Schema.optional(Url)
})
```

### Monetary Values

```typescript
import { Schema } from "effect"

const USD = Schema.Number.pipe(
  Schema.finite(),
  Schema.brand("USD")
)

const EUR = Schema.Number.pipe(
  Schema.finite(),
  Schema.brand("EUR")
)

// Can't accidentally mix currencies!
function addUSD(a: typeof USD.Type, b: typeof USD.Type): typeof USD.Type {
  return USD.make(a + b)
}

const dollars = Schema.decodeSync(USD)(100)
const euros = Schema.decodeSync(EUR)(50)

addUSD(dollars, dollars)  // ✅
addUSD(dollars, euros)    // ❌ Type error!
```

### Safe Numeric Types

```typescript
import { Schema } from "effect"

const Percentage = Schema.Number.pipe(
  Schema.between(0, 100),
  Schema.brand("Percentage")
)

const Probability = Schema.Number.pipe(
  Schema.between(0, 1),
  Schema.brand("Probability")
)

const Age = Schema.Number.pipe(
  Schema.int(),
  Schema.between(0, 150),
  Schema.brand("Age")
)

// Type-safe calculations
function adjustAge(age: typeof Age.Type, years: number): typeof Age.Type {
  return Age.make(age + years)  // Re-validates!
}
```

## Brands in Transformations

Brands are preserved through transformations:

```typescript
import { Schema } from "effect"

const UserId = Schema.String.pipe(Schema.brand("UserId"))

const User = Schema.Struct({
  id: UserId,
  createdAt: Schema.DateFromString
})

type User = typeof User.Type
// {
//   readonly id: string & Brand<"UserId">
//   readonly createdAt: Date
// }

// Decode preserves the brand
const user = Schema.decodeSync(User)({
  id: "user_123",
  createdAt: "2024-01-15"
})
// user.id has type: string & Brand<"UserId">
```

## Type Assertions

Sometimes you need to assert a value is branded without validation:

```typescript
import { Schema } from "effect"

const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type

// ⚠️ Unsafe assertion (skips validation)
function unsafeUserId(s: string): UserId {
  return s as UserId
}

// ✅ Safe creation (validates)
function safeUserId(s: string): UserId {
  return Schema.decodeSync(UserId)(s)
}
```

::: warning Type Assertions
Avoid type assertions (`as UserId`). They bypass validation and defeat the purpose of brands. Always use `Schema.decodeSync` or `make()` to create branded values.
:::

## Best Practices

### 1. Brand Domain Entities

```typescript
// ✅ Brand IDs to prevent mixing
const UserId = Schema.String.pipe(Schema.brand("UserId"))
const OrderId = Schema.String.pipe(Schema.brand("OrderId"))

// ❌ Raw strings are error-prone
const userId: string = "user_123"
const orderId: string = "order_456"
```

### 2. Combine with Validation

```typescript
// ✅ Brand + validation = bulletproof
const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("Email")
)

// ⚠️ Brand alone doesn't validate format
const UnsafeEmail = Schema.String.pipe(Schema.brand("Email"))
```

### 3. Use Descriptive Brand Names

```typescript
// ✅ Clear semantic meaning
const UserId = Schema.String.pipe(Schema.brand("UserId"))
const CentsAmount = Schema.Number.pipe(Schema.brand("CentsAmount"))

// ❌ Generic or unclear
const Id = Schema.String.pipe(Schema.brand("Id"))  // Id of what?
const Num = Schema.Number.pipe(Schema.brand("Num"))  // What kind?
```

### 4. Create Brand Modules

```typescript
// brands.ts
import { Schema } from "effect"

export const UserId = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.brand("UserId")
)
export type UserId = typeof UserId.Type

export const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("Email")
)
export type Email = typeof Email.Type

// Usage
import { UserId, Email } from "./brands"
```

## Summary

| Pattern | Description |
|---------|-------------|
| `Schema.brand("Name")` | Add nominal typing |
| `Schema.fromBrand(constructor)` | Use Effect Brand constructor |
| `BrandedSchema.make(value)` | Create branded value (validates) |
| Multiple brands | Stack `brand()` calls |

## Next Steps

- [Classes](/guide/classes) - Schema-backed TypeScript classes
- [Unions](/guide/unions) - Union types and discriminated unions
- [Best Practices](/best-practices/) - Schema design patterns

