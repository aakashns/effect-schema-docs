---
title: Unions
description: Learn how to define union types and discriminated unions in Effect Schema
---

# Unions

Unions let you define schemas that accept multiple possible types. Effect Schema excels at discriminated unions, which are essential for modeling domain types.

## Basic Union

Combine multiple schemas into a union:

```typescript
import { Schema } from "effect"

// String or number
const StringOrNumber = Schema.Union(Schema.String, Schema.Number)
// Schema<string | number, string | number, never>

Schema.decodeUnknownSync(StringOrNumber)("hello")  // ✅ "hello"
Schema.decodeUnknownSync(StringOrNumber)(42)       // ✅ 42
Schema.decodeUnknownSync(StringOrNumber)(true)     // ❌ ParseError
```

### Multiple Members

Unions can have any number of members:

```typescript
import { Schema } from "effect"

const Primitive = Schema.Union(
  Schema.String,
  Schema.Number,
  Schema.Boolean,
  Schema.Null
)

type Primitive = typeof Primitive.Type
// string | number | boolean | null
```

## Discriminated Unions

Discriminated unions use a common property (the "discriminant" or "tag") to distinguish between variants. This is the recommended pattern for complex unions.

```typescript
import { Schema } from "effect"

const Shape = Schema.Union(
  Schema.Struct({
    type: Schema.Literal("circle"),
    radius: Schema.Number
  }),
  Schema.Struct({
    type: Schema.Literal("rectangle"),
    width: Schema.Number,
    height: Schema.Number
  }),
  Schema.Struct({
    type: Schema.Literal("triangle"),
    base: Schema.Number,
    height: Schema.Number
  })
)

type Shape = typeof Shape.Type
// | { readonly type: "circle"; readonly radius: number }
// | { readonly type: "rectangle"; readonly width: number; readonly height: number }
// | { readonly type: "triangle"; readonly base: number; readonly height: number }

// TypeScript can narrow based on the discriminant
function area(shape: Shape): number {
  switch (shape.type) {
    case "circle":
      return Math.PI * shape.radius ** 2
    case "rectangle":
      return shape.width * shape.height
    case "triangle":
      return 0.5 * shape.base * shape.height
  }
}
```

::: tip Why Discriminated Unions?
1. **Type narrowing**: TypeScript can narrow types based on the discriminant
2. **Exhaustiveness**: TypeScript warns if you miss a case
3. **Performance**: Schema can quickly identify the correct variant
4. **Clarity**: The discriminant makes data self-documenting
:::

### Using TaggedStruct

`Schema.TaggedStruct` is a convenient helper for discriminated unions:

```typescript
import { Schema } from "effect"

const Success = Schema.TaggedStruct("Success", {
  data: Schema.Unknown
})
// { readonly _tag: "Success"; readonly data: unknown }

const Failure = Schema.TaggedStruct("Failure", {
  error: Schema.String
})
// { readonly _tag: "Failure"; readonly error: string }

const Result = Schema.Union(Success, Failure)

type Result = typeof Result.Type
// | { readonly _tag: "Success"; readonly data: unknown }
// | { readonly _tag: "Failure"; readonly error: string }
```

### Attach Property Signature

Add a discriminant to an existing struct:

```typescript
import { Schema } from "effect"

const Circle = Schema.Struct({
  radius: Schema.Number
})

const Rectangle = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number
})

const Shape = Schema.Union(
  Circle.pipe(Schema.attachPropertySignature("type", "circle")),
  Rectangle.pipe(Schema.attachPropertySignature("type", "rectangle"))
)

// Decoding adds the discriminant automatically
Schema.decodeUnknownSync(Shape)({ radius: 5 })
// { type: "circle", radius: 5 }

Schema.decodeUnknownSync(Shape)({ width: 10, height: 20 })
// { type: "rectangle", width: 10, height: 20 }

// Encoding removes it
Schema.encodeSync(Shape)({ type: "circle", radius: 5 })
// { radius: 5 }
```

## Nullable and Optional Unions

Common patterns for optional values:

```typescript
import { Schema } from "effect"

// string | null
const NullableString = Schema.NullOr(Schema.String)

// string | undefined
const OptionalString = Schema.UndefinedOr(Schema.String)

// string | null | undefined
const NullishString = Schema.NullishOr(Schema.String)

// Example usage
const User = Schema.Struct({
  name: Schema.String,
  nickname: Schema.NullOr(Schema.String),      // Can be null
  bio: Schema.UndefinedOr(Schema.String),      // Can be undefined
  website: Schema.NullishOr(Schema.String)     // Can be null or undefined
})
```

## Either-like Unions

Handle success/failure patterns:

```typescript
import { Schema } from "effect"

// Manual either-like union
const ApiResponse = Schema.Union(
  Schema.Struct({
    success: Schema.Literal(true),
    data: Schema.Unknown
  }),
  Schema.Struct({
    success: Schema.Literal(false),
    error: Schema.String
  })
)

// Using Effect's Either type
const EitherResult = Schema.Either({
  left: Schema.String,    // Error type
  right: Schema.Number    // Success type
})
// Type is Either<number, string>
```

## Union Decoding Strategy

When decoding a union, Schema tries each member in order until one succeeds:

```typescript
import { Schema } from "effect"

// Order matters for overlapping types!
const NumberFirst = Schema.Union(
  Schema.Number,
  Schema.NumberFromString
)

// 42 matches Number first
Schema.decodeUnknownSync(NumberFirst)(42)  // 42 (number, not transformed)

// "42" doesn't match Number, tries NumberFromString
Schema.decodeUnknownSync(NumberFirst)("42")  // 42 (transformed)
```

::: warning Union Order
For discriminated unions, order doesn't matter because the discriminant uniquely identifies each variant. For non-discriminated unions, more specific schemas should come first.
:::

## Union Error Messages

When all union members fail, Schema provides detailed errors:

```typescript
import { Schema } from "effect"

const StringOrNumber = Schema.Union(Schema.String, Schema.Number)

try {
  Schema.decodeUnknownSync(StringOrNumber)(true)
} catch (error) {
  console.log(String(error))
}
// (string | number)
// ├─ Union member
// │  └─ Expected string, actual true
// └─ Union member
//    └─ Expected number, actual true
```

## Union Composition

Build complex unions from smaller ones:

```typescript
import { Schema } from "effect"

// Primitive union
const Primitive = Schema.Union(
  Schema.String,
  Schema.Number,
  Schema.Boolean,
  Schema.Null
)

// JSON value (recursive)
interface JsonValue {
  readonly [k: string]: JsonValue | JsonValue[] | string | number | boolean | null
}

const JsonValue: Schema.Schema<JsonValue> = Schema.suspend(
  () => Schema.Union(
    Primitive,
    Schema.Array(JsonValue),
    Schema.Record({ key: Schema.String, value: JsonValue })
  )
)
```

## Practical Examples

### API Error Handling

```typescript
import { Schema } from "effect"

const ApiError = Schema.Union(
  Schema.Struct({
    code: Schema.Literal("VALIDATION_ERROR"),
    field: Schema.String,
    message: Schema.String
  }),
  Schema.Struct({
    code: Schema.Literal("AUTH_ERROR"),
    reason: Schema.Literal("expired", "invalid", "missing")
  }),
  Schema.Struct({
    code: Schema.Literal("NOT_FOUND"),
    resource: Schema.String,
    id: Schema.String
  }),
  Schema.Struct({
    code: Schema.Literal("SERVER_ERROR"),
    requestId: Schema.String
  })
)

type ApiError = typeof ApiError.Type
```

### Message Types

```typescript
import { Schema } from "effect"

const Message = Schema.Union(
  Schema.TaggedStruct("TextMessage", {
    content: Schema.String,
    senderId: Schema.String
  }),
  Schema.TaggedStruct("ImageMessage", {
    url: Schema.String,
    width: Schema.Number,
    height: Schema.Number,
    senderId: Schema.String
  }),
  Schema.TaggedStruct("SystemMessage", {
    content: Schema.String
  })
)

function renderMessage(msg: typeof Message.Type): string {
  switch (msg._tag) {
    case "TextMessage":
      return `${msg.senderId}: ${msg.content}`
    case "ImageMessage":
      return `${msg.senderId} sent an image`
    case "SystemMessage":
      return `[System] ${msg.content}`
  }
}
```

### Database Entities

```typescript
import { Schema } from "effect"

const BaseEntity = Schema.Struct({
  id: Schema.String,
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString
})

const User = BaseEntity.pipe(
  Schema.extend(Schema.Struct({
    type: Schema.Literal("user"),
    email: Schema.String,
    name: Schema.String
  }))
)

const Organization = BaseEntity.pipe(
  Schema.extend(Schema.Struct({
    type: Schema.Literal("organization"),
    name: Schema.String,
    domain: Schema.String
  }))
)

const Entity = Schema.Union(User, Organization)
```

## Best Practices

### 1. Prefer Discriminated Unions

```typescript
import { Schema } from "effect"

// ❌ Ambiguous union
const Bad = Schema.Union(
  Schema.Struct({ name: Schema.String }),
  Schema.Struct({ title: Schema.String })
)
// What if input has both name and title?

// ✅ Clear discriminant
const Good = Schema.Union(
  Schema.Struct({ type: Schema.Literal("person"), name: Schema.String }),
  Schema.Struct({ type: Schema.Literal("book"), title: Schema.String })
)
```

### 2. Use Consistent Discriminants

```typescript
import { Schema } from "effect"

// ✅ Consistent "_tag" pattern
const A = Schema.TaggedStruct("A", { value: Schema.String })
const B = Schema.TaggedStruct("B", { count: Schema.Number })
const Union = Schema.Union(A, B)

// ❌ Inconsistent discriminants
const X = Schema.Struct({ type: Schema.Literal("x") })
const Y = Schema.Struct({ kind: Schema.Literal("y") })  // Different key!
```

### 3. Extract Common Fields

```typescript
import { Schema } from "effect"

// ✅ Common fields in base
const BaseEvent = {
  id: Schema.String,
  timestamp: Schema.DateFromString,
  userId: Schema.String
}

const ClickEvent = Schema.Struct({
  ...BaseEvent,
  type: Schema.Literal("click"),
  target: Schema.String
})

const PageViewEvent = Schema.Struct({
  ...BaseEvent,
  type: Schema.Literal("pageview"),
  url: Schema.String
})
```

## Summary

| Pattern | Use Case |
|---------|----------|
| `Union(a, b, c)` | Multiple possible types |
| `TaggedStruct(tag, fields)` | Discriminated union member |
| `attachPropertySignature` | Add discriminant to existing struct |
| `NullOr(s)` | Schema or null |
| `UndefinedOr(s)` | Schema or undefined |
| `NullishOr(s)` | Schema or null or undefined |

## Next Steps

- [Records](/guide/records) - Dynamic key-value objects
- [Optional & Nullable](/guide/optional-nullable) - Handling missing values
- [Transformations](/guide/transformations) - Converting between types

