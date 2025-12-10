---
title: Literals & Enums
description: Learn about literal types and enum handling in Effect Schema
---

# Literals & Enums

Literals and enums let you define schemas for exact values rather than general types.

## Literals

Use `Schema.Literal` when you need an exact value:

```typescript
import { Schema } from "effect"

// Single literal
const AdminRole = Schema.Literal("admin")
// Schema<"admin", "admin", never>

Schema.decodeUnknownSync(AdminRole)("admin")  // ✅ "admin"
Schema.decodeUnknownSync(AdminRole)("user")   // ❌ ParseError
```

### Multiple Literals

Pass multiple values to create a union of literals:

```typescript
import { Schema } from "effect"

const Role = Schema.Literal("admin", "user", "guest")
// Schema<"admin" | "user" | "guest", "admin" | "user" | "guest", never>

type Role = typeof Role.Type
// "admin" | "user" | "guest"

Schema.decodeUnknownSync(Role)("admin")   // ✅
Schema.decodeUnknownSync(Role)("user")    // ✅
Schema.decodeUnknownSync(Role)("guest")   // ✅
Schema.decodeUnknownSync(Role)("other")   // ❌ ParseError
```

### Supported Literal Types

Literals support strings, numbers, booleans, null, and bigints:

```typescript
import { Schema } from "effect"

// String literal
const Hello = Schema.Literal("hello")

// Number literal
const FortyTwo = Schema.Literal(42)

// Boolean literal
const True = Schema.Literal(true)

// Null literal
const Null = Schema.Literal(null)

// BigInt literal
const BigNum = Schema.Literal(100n)

// Mixed literals in union
const Mixed = Schema.Literal("active", 1, true, null)
// Schema<"active" | 1 | true | null>
```

### Pick from Literal

Extract a subset of literals from an existing literal schema:

```typescript
import { Schema } from "effect"

const AllRoles = Schema.Literal("admin", "moderator", "user", "guest")

// Pick only some values
const PrivilegedRoles = AllRoles.pipe(Schema.pickLiteral("admin", "moderator"))
// Schema<"admin" | "moderator">
```

## TypeScript Enums

Schema supports TypeScript enums via `Schema.Enums`:

```typescript
import { Schema } from "effect"

// String enum
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

const ColorSchema = Schema.Enums(Color)
// Schema<Color, "RED" | "GREEN" | "BLUE", never>

Schema.decodeUnknownSync(ColorSchema)("RED")    // ✅ Color.Red
Schema.decodeUnknownSync(ColorSchema)("YELLOW") // ❌ ParseError

// The type is the enum itself
type ColorType = typeof ColorSchema.Type
// Color
```

### Numeric Enums

```typescript
import { Schema } from "effect"

enum Status {
  Pending,    // 0
  Active,     // 1
  Completed   // 2
}

const StatusSchema = Schema.Enums(Status)

Schema.decodeUnknownSync(StatusSchema)(0)  // ✅ Status.Pending
Schema.decodeUnknownSync(StatusSchema)(1)  // ✅ Status.Active
Schema.decodeUnknownSync(StatusSchema)(5)  // ❌ ParseError
```

### Const Enums

TypeScript const enums are inlined at compile time, so they work differently:

```typescript
import { Schema } from "effect"

// ❌ Const enums don't exist at runtime
const enum MyConstEnum {
  A = "A",
  B = "B"
}
// Can't use Schema.Enums(MyConstEnum)

// ✅ Use literals instead
const MySchema = Schema.Literal("A", "B")
```

### Enum Best Practices

::: tip Prefer String Enums
String enums are more readable in logs and debuggers:

```typescript
// ✅ String enum - clear in logs
enum Status {
  Pending = "PENDING",
  Active = "ACTIVE"
}
// Decoded value: "PENDING"

// ⚠️ Numeric enum - less clear
enum NumericStatus {
  Pending,  // 0
  Active    // 1
}
// Decoded value: 0
```
:::

## Unique Symbols

For unique symbol literals:

```typescript
import { Schema } from "effect"

// Create a unique symbol
const mySymbol = Symbol.for("myApp/uniqueId")

const SymbolSchema = Schema.UniqueSymbolFromSelf(mySymbol)

Schema.decodeUnknownSync(SymbolSchema)(mySymbol)           // ✅
Schema.decodeUnknownSync(SymbolSchema)(Symbol.for("other")) // ❌ ParseError
```

## Template Literals

Create schemas for template literal patterns:

```typescript
import { Schema } from "effect"

// Fixed prefix/suffix
const UserId = Schema.TemplateLiteral("user_", Schema.String)
// Matches: "user_123", "user_abc", etc.
type UserId = typeof UserId.Type // `user_${string}`

Schema.decodeUnknownSync(UserId)("user_123")   // ✅ "user_123"
Schema.decodeUnknownSync(UserId)("admin_123")  // ❌ ParseError

// Multiple parts
const Version = Schema.TemplateLiteral(Schema.Number, ".", Schema.Number, ".", Schema.Number)
// Matches: "1.2.3", "10.20.30", etc.
type Version = typeof Version.Type // `${number}.${number}.${number}`

// With literals
const Endpoint = Schema.TemplateLiteral(
  "/api/",
  Schema.Literal("users", "posts"),
  "/",
  Schema.Number
)
// Matches: "/api/users/1", "/api/posts/42", etc.
```

### Template Literal Parser

For more complex parsing, use `TemplateLiteralParser` which extracts the parts:

```typescript
import { Schema } from "effect"

const VersionParser = Schema.TemplateLiteralParser(
  Schema.NumberFromString,
  ".",
  Schema.NumberFromString,
  ".",
  Schema.NumberFromString
)
// Schema<[number, number, number], `${string}.${string}.${string}`>

const parsed = Schema.decodeSync(VersionParser)("1.2.3")
// [1, 2, 3] - extracted as numbers!

const encoded = Schema.encodeSync(VersionParser)([1, 2, 3])
// "1.2.3"
```

## Literal Transformations

Transform between literals with `transformLiteral` and `transformLiterals`:

```typescript
import { Schema } from "effect"

// Single transformation
const ActiveFlag = Schema.transformLiteral(1, "active")
// 1 ↔ "active"

Schema.decodeSync(ActiveFlag)(1)  // "active"
Schema.encodeSync(ActiveFlag)("active")  // 1

// Multiple transformations
const StatusCode = Schema.transformLiterals(
  [200, "ok"],
  [404, "notFound"],
  [500, "serverError"]
)
// 200 ↔ "ok", 404 ↔ "notFound", 500 ↔ "serverError"

Schema.decodeSync(StatusCode)(200)  // "ok"
Schema.decodeSync(StatusCode)(404)  // "notFound"
Schema.encodeSync(StatusCode)("ok")  // 200
```

## Practical Examples

### API Status Codes

```typescript
import { Schema } from "effect"

const HttpStatus = Schema.Literal(200, 201, 400, 401, 403, 404, 500)

const ApiResponse = Schema.Struct({
  status: HttpStatus,
  data: Schema.Unknown
})
```

### Feature Flags

```typescript
import { Schema } from "effect"

const FeatureFlag = Schema.Literal(
  "dark_mode",
  "new_checkout",
  "beta_features"
)

const UserFeatures = Schema.Struct({
  userId: Schema.String,
  enabledFeatures: Schema.Array(FeatureFlag)
})
```

### Discriminated Unions

Literals are essential for discriminated unions:

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
// { type: "circle", radius: number }
// | { type: "rectangle", width: number, height: number }
// | { type: "triangle", base: number, height: number }
```

## Summary

| Schema | Use Case |
|--------|----------|
| `Literal(v1, v2, ...)` | Exact string/number/boolean values |
| `Enums(E)` | TypeScript enums |
| `UniqueSymbolFromSelf(s)` | Unique symbol values |
| `TemplateLiteral(...)` | Pattern-based strings |
| `TemplateLiteralParser(...)` | Parse and extract from patterns |
| `transformLiteral(from, to)` | Transform single literal |
| `transformLiterals([from, to], ...)` | Transform multiple literals |

## Next Steps

- [Structs](/guide/structs) - Object schemas
- [Unions](/guide/unions) - Combining schemas with discriminated unions

