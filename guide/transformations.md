---
title: Understanding Transformations
description: Learn how transformations work in Effect Schema for converting between different data representations
---

# Understanding Transformations

Transformations are what make Effect Schema unique. They define bidirectional conversions between your external data format (Encoded) and your internal application types (Type).

## Why Transformations Matter

Consider a date field:

- **External**: JSON has no Date type, so dates are strings `"2024-01-15T10:30:00Z"`
- **Internal**: Your app uses JavaScript `Date` objects

Without transformations, you'd manually convert everywhere:

```typescript
// ❌ Manual conversion everywhere
const user = JSON.parse(response)
user.createdAt = new Date(user.createdAt)

// Serialize before sending
user.createdAt = user.createdAt.toISOString()
JSON.stringify(user)
```

With Schema transformations:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  createdAt: Schema.DateFromString  // Automatic conversion!
})

// ✅ Decode: string → Date
const user = Schema.decodeUnknownSync(User)(JSON.parse(response))
// user.createdAt is a Date

// ✅ Encode: Date → string
JSON.stringify(Schema.encodeSync(User)(user))
// createdAt is back to string
```

## The Type/Encoded Duality

Every schema has two associated types:

```typescript
import { Schema } from "effect"

const MySchema = Schema.DateFromString
// Schema<Date, string, never>
//         ↑     ↑      ↑
//        Type  Encoded Context
```

- **Type** (`Date`): Your application's internal representation
- **Encoded** (`string`): The external/serialized format
- **Context** (`never`): Effect dependencies (usually `never`)

Access these types:

```typescript
import { Schema } from "effect"

const UserSchema = Schema.Struct({
  name: Schema.String,
  createdAt: Schema.DateFromString
})

type User = typeof UserSchema.Type
// { readonly name: string; readonly createdAt: Date }

type UserEncoded = typeof UserSchema.Encoded
// { readonly name: string; readonly createdAt: string }
```

## Built-in Transformations

Schema provides many built-in transformations:

### String ↔ Number

```typescript
import { Schema } from "effect"

const NumberFromString = Schema.NumberFromString
// Schema<number, string>

Schema.decodeSync(NumberFromString)("42")     // 42
Schema.decodeSync(NumberFromString)("3.14")   // 3.14
Schema.decodeSync(NumberFromString)("NaN")    // NaN

Schema.encodeSync(NumberFromString)(42)       // "42"
```

### String ↔ Boolean

```typescript
import { Schema } from "effect"

const BoolFromString = Schema.BooleanFromString
// "true" ↔ true, "false" ↔ false

Schema.decodeSync(BoolFromString)("true")   // true
Schema.decodeSync(BoolFromString)("false")  // false
```

### String ↔ Date

```typescript
import { Schema } from "effect"

const DateFromString = Schema.DateFromString
// ISO 8601 string ↔ Date

Schema.decodeSync(DateFromString)("2024-01-15T10:30:00Z")  // Date
Schema.encodeSync(DateFromString)(new Date())              // ISO string
```

### Number ↔ BigInt

```typescript
import { Schema } from "effect"

const BigIntFromNumber = Schema.BigIntFromNumber
// number ↔ bigint

Schema.decodeSync(BigIntFromNumber)(42)  // 42n
Schema.encodeSync(BigIntFromNumber)(42n) // 42
```

### String ↔ BigInt

```typescript
import { Schema } from "effect"

const BigInt = Schema.BigInt
// string ↔ bigint

Schema.decodeSync(BigInt)("12345678901234567890")  // 12345678901234567890n
```

### JSON String ↔ Object

```typescript
import { Schema } from "effect"

const JsonUser = Schema.parseJson(
  Schema.Struct({
    name: Schema.String,
    age: Schema.Number
  })
)
// string (JSON) ↔ { name: string, age: number }

Schema.decodeSync(JsonUser)('{"name":"Alice","age":30}')
// { name: "Alice", age: 30 }

Schema.encodeSync(JsonUser)({ name: "Alice", age: 30 })
// '{"name":"Alice","age":30}'
```

### String Transformations

```typescript
import { Schema } from "effect"

// Trim whitespace
const Trimmed = Schema.Trim
Schema.decodeSync(Trimmed)("  hello  ")  // "hello"

// Lowercase
const Lower = Schema.Lowercase
Schema.decodeSync(Lower)("HELLO")  // "hello"

// Uppercase
const Upper = Schema.Uppercase
Schema.decodeSync(Upper)("hello")  // "HELLO"

// Split into array
const Split = Schema.split(",")
Schema.decodeSync(Split)("a,b,c")  // ["a", "b", "c"]
```

## Creating Custom Transformations

### Schema.transform

For transformations that always succeed:

```typescript
import { Schema } from "effect"

// String → reversed string
const Reversed = Schema.transform(
  Schema.String,  // From (Encoded)
  Schema.String,  // To (Type)
  {
    decode: (s) => s.split("").reverse().join(""),
    encode: (s) => s.split("").reverse().join("")
  }
)

Schema.decodeSync(Reversed)("hello")  // "olleh"
Schema.encodeSync(Reversed)("olleh")  // "hello"
```

The options object:
- `decode`: Encoded → Type transformation
- `encode`: Type → Encoded transformation
- `strict`: Set to `true` if input types exactly match (for type safety)

### Schema.transformOrFail

For transformations that can fail:

```typescript
import { Schema, ParseResult } from "effect"

const IntFromString = Schema.transformOrFail(
  Schema.String,
  Schema.Number,
  {
    decode: (s, _, ast) => {
      const n = parseInt(s, 10)
      if (isNaN(n)) {
        return ParseResult.fail(
          new ParseResult.Type(ast, s, "Expected integer string")
        )
      }
      return ParseResult.succeed(n)
    },
    encode: (n) => ParseResult.succeed(String(n))
  }
)

Schema.decodeSync(IntFromString)("42")    // 42
Schema.decodeSync(IntFromString)("3.14")  // 3 (parseInt behavior)
Schema.decodeSync(IntFromString)("abc")   // ❌ ParseError
```

### Asymmetric Transformations

Encode and decode don't have to be inverses:

```typescript
import { Schema } from "effect"

// Normalize email: decode lowercases, encode preserves
const Email = Schema.transform(
  Schema.String,
  Schema.String,
  {
    decode: (s) => s.toLowerCase().trim(),
    encode: (s) => s  // Don't modify on encode
  }
)

Schema.decodeSync(Email)("  ALICE@EXAMPLE.COM  ")  // "alice@example.com"
Schema.encodeSync(Email)("alice@example.com")      // "alice@example.com"
```

## Composing Transformations

### Chaining with pipe

```typescript
import { Schema } from "effect"

// String → trimmed string → number
const NumberFromTrimmedString = Schema.String.pipe(
  Schema.compose(Schema.Trim),
  Schema.compose(Schema.NumberFromString)
)

Schema.decodeSync(NumberFromTrimmedString)("  42  ")  // 42
```

### Using compose

```typescript
import { Schema } from "effect"

const A = Schema.Trim                  // string → string
const B = Schema.NumberFromString      // string → number

const Combined = Schema.compose(A, B)  // string → number

Schema.decodeSync(Combined)("  42  ")  // 42
```

## Transformation Options

### strict Mode

Set `strict: true` when your input type exactly matches:

```typescript
import { Schema } from "effect"

// ✅ strict: true - input is exactly string
const A = Schema.transform(
  Schema.String,
  Schema.String,
  {
    strict: true,  // TypeScript ensures decode receives string
    decode: (s) => s.toUpperCase(),
    encode: (s) => s.toLowerCase()
  }
)

// ❌ strict: false (default) - input might be unknown
const B = Schema.transform(
  Schema.String,
  Schema.String,
  {
    strict: false,  // decode receives unknown
    decode: (input) => String(input).toUpperCase(),
    encode: (s) => s.toLowerCase()
  }
)
```

## Type and Encoded Schemas

Extract just the Type or Encoded schema:

```typescript
import { Schema } from "effect"

const MySchema = Schema.Struct({
  name: Schema.String,
  createdAt: Schema.DateFromString
})

// Just the Type schema (no transformations)
const TypeOnly = Schema.typeSchema(MySchema)
// Schema<{ name: string, createdAt: Date }, { name: string, createdAt: Date }>

// Just the Encoded schema (no transformations)
const EncodedOnly = Schema.encodedSchema(MySchema)
// Schema<{ name: string, createdAt: string }, { name: string, createdAt: string }>
```

## Practical Examples

### Currency Amount

```typescript
import { Schema } from "effect"

// Store amounts in cents, display in dollars
const DollarAmount = Schema.transform(
  Schema.Number,  // Encoded: cents (integer)
  Schema.Number,  // Type: dollars (decimal)
  {
    decode: (cents) => cents / 100,
    encode: (dollars) => Math.round(dollars * 100)
  }
)

Schema.decodeSync(DollarAmount)(1999)    // 19.99
Schema.encodeSync(DollarAmount)(19.99)   // 1999
```

### Slug Generator

```typescript
import { Schema } from "effect"

const Slug = Schema.transform(
  Schema.String,
  Schema.String.pipe(Schema.pattern(/^[a-z0-9-]+$/)),
  {
    decode: (s) =>
      s.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    encode: (s) => s  // Slugs stay as-is
  }
)

Schema.decodeSync(Slug)("Hello World!")  // "hello-world"
```

### Enum Mapping

```typescript
import { Schema } from "effect"

const Status = Schema.transform(
  Schema.Literal(0, 1, 2),
  Schema.Literal("pending", "active", "completed"),
  {
    decode: (n) => 
      n === 0 ? "pending" : n === 1 ? "active" : "completed",
    encode: (s) => 
      s === "pending" ? 0 : s === "active" ? 1 : 2
  }
)

Schema.decodeSync(Status)(0)  // "pending"
Schema.encodeSync(Status)("active")  // 1
```

### Base64 Encoding

```typescript
import { Schema, ParseResult } from "effect"

const Base64 = Schema.transformOrFail(
  Schema.String,
  Schema.String,
  {
    decode: (encoded, _, ast) => {
      try {
        return ParseResult.succeed(atob(encoded))
      } catch {
        return ParseResult.fail(
          new ParseResult.Type(ast, encoded, "Invalid base64")
        )
      }
    },
    encode: (decoded) => ParseResult.succeed(btoa(decoded))
  }
)

Schema.decodeSync(Base64)("SGVsbG8gV29ybGQ=")  // "Hello World"
Schema.encodeSync(Base64)("Hello World")        // "SGVsbG8gV29ybGQ="
```

## Summary

| Concept | Description |
|---------|-------------|
| **Type** | Internal application type |
| **Encoded** | External/serialized type |
| **decode** | Encoded → Type |
| **encode** | Type → Encoded |
| `transform` | Always-succeeding transformation |
| `transformOrFail` | Can-fail transformation |
| `compose` | Chain transformations |
| `typeSchema` | Extract Type-only schema |
| `encodedSchema` | Extract Encoded-only schema |

## Next Steps

- [Filters](/guide/filters) - Built-in validation filters
- [Classes](/guide/classes) - Schema-backed TypeScript classes
- [JSON Schema](/guide/json-schema) - Generate JSON Schema from definitions

