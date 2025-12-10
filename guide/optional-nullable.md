---
title: Optional & Nullable
description: Learn how to handle optional properties and nullable values in Effect Schema
---

# Optional & Nullable

Handling missing or null values correctly is crucial for robust validation. Effect Schema provides flexible options for modeling optionality.

## Understanding the Difference

Before diving in, let's clarify the terminology:

| Term | JavaScript | TypeScript |
|------|-----------|------------|
| **Optional property** | Property may not exist on object | `{ prop?: T }` |
| **Nullable value** | Value can be `null` | `T \| null` |
| **Undefined value** | Value can be `undefined` | `T \| undefined` |
| **Nullish** | Can be `null` or `undefined` | `T \| null \| undefined` |

## Optional Properties

Use `Schema.optional` in struct definitions:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  nickname: Schema.optional(Schema.String)
})

type User = typeof User.Type
// {
//   readonly id: string
//   readonly name: string
//   readonly nickname?: string | undefined
// }

// Valid - nickname omitted
Schema.decodeUnknownSync(User)({ id: "1", name: "Alice" })

// Valid - nickname present
Schema.decodeUnknownSync(User)({ id: "1", name: "Alice", nickname: "Ali" })

// Valid - nickname explicitly undefined
Schema.decodeUnknownSync(User)({ id: "1", name: "Alice", nickname: undefined })
```

### Optional with Options

`Schema.optional` accepts options for different behaviors:

```typescript
import { Schema } from "effect"

const Example = Schema.Struct({
  // Standard: accepts missing, undefined
  a: Schema.optional(Schema.String),
  // Type: string | undefined
  
  // Exact: accepts missing only (no undefined)
  b: Schema.optional(Schema.String, { exact: true }),
  // Type: string (but property is optional)
  
  // With default: always present after decode
  c: Schema.optional(Schema.String, { default: () => "default" }),
  // Type: string
  
  // Nullable: accepts null in encoded form
  d: Schema.optional(Schema.String, { nullable: true }),
  // Type: string | undefined, Encoded accepts null
  
  // Exact + nullable
  e: Schema.optional(Schema.String, { exact: true, nullable: true }),
  // Type: string, Encoded accepts null
  
  // As Option: wraps in Option type
  f: Schema.optional(Schema.String, { as: "Option" }),
  // Type: Option<string>
})
```

### Default Values

Provide defaults for optional properties:

```typescript
import { Schema } from "effect"

const Settings = Schema.Struct({
  theme: Schema.optional(Schema.String, { default: () => "light" }),
  fontSize: Schema.optional(Schema.Number, { default: () => 14 }),
  notifications: Schema.optional(Schema.Boolean, { default: () => true })
})

type Settings = typeof Settings.Type
// All properties are required in the Type (defaults fill them in)
// {
//   readonly theme: string
//   readonly fontSize: number
//   readonly notifications: boolean
// }

// Defaults are applied during decode
Schema.decodeUnknownSync(Settings)({})
// { theme: "light", fontSize: 14, notifications: true }

Schema.decodeUnknownSync(Settings)({ theme: "dark" })
// { theme: "dark", fontSize: 14, notifications: true }
```

### Separate Decoding and Constructor Defaults

You can have different defaults for decoding vs constructing:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  createdAt: Schema.propertySignature(Schema.DateFromString).pipe(
    Schema.withDecodingDefault(() => new Date()),
    Schema.withConstructorDefault(() => new Date())
  )
})

// Decoding: uses decoding default if missing
Schema.decodeUnknownSync(User)({ name: "Alice" })
// { name: "Alice", createdAt: Date (now) }

// Constructor: uses constructor default if not provided
User.make({ name: "Alice" })
// { name: "Alice", createdAt: Date (now) }
```

## Nullable Values

### NullOr

Accept a value or `null`:

```typescript
import { Schema } from "effect"

const NullableString = Schema.NullOr(Schema.String)
// Schema<string | null, string | null>

Schema.decodeUnknownSync(NullableString)("hello")  // ✅ "hello"
Schema.decodeUnknownSync(NullableString)(null)     // ✅ null
Schema.decodeUnknownSync(NullableString)(undefined) // ❌ ParseError
```

### UndefinedOr

Accept a value or `undefined`:

```typescript
import { Schema } from "effect"

const OptionalString = Schema.UndefinedOr(Schema.String)
// Schema<string | undefined, string | undefined>

Schema.decodeUnknownSync(OptionalString)("hello")    // ✅ "hello"
Schema.decodeUnknownSync(OptionalString)(undefined)  // ✅ undefined
Schema.decodeUnknownSync(OptionalString)(null)       // ❌ ParseError
```

### NullishOr

Accept a value, `null`, or `undefined`:

```typescript
import { Schema } from "effect"

const NullishString = Schema.NullishOr(Schema.String)
// Schema<string | null | undefined, string | null | undefined>

Schema.decodeUnknownSync(NullishString)("hello")    // ✅ "hello"
Schema.decodeUnknownSync(NullishString)(null)       // ✅ null
Schema.decodeUnknownSync(NullishString)(undefined)  // ✅ undefined
```

## Using Option Type

Effect's `Option` type is a better alternative to null/undefined:

### Option from Self

For data already in Option format:

```typescript
import { Schema } from "effect"
import { Option } from "effect"

const OptionalNumber = Schema.OptionFromSelf(Schema.Number)
// Schema<Option<number>, Option<number>>

Schema.decodeUnknownSync(OptionalNumber)(Option.some(42))  // ✅ Some(42)
Schema.decodeUnknownSync(OptionalNumber)(Option.none())    // ✅ None
```

### Option from Encoded

Transform from { _tag, value } format:

```typescript
import { Schema } from "effect"

const OptionalNumber = Schema.Option(Schema.Number)
// Encoded: { _tag: "None" } | { _tag: "Some", value: number }
// Type: Option<number>

Schema.decodeSync(OptionalNumber)({ _tag: "None" })           // None
Schema.decodeSync(OptionalNumber)({ _tag: "Some", value: 42 }) // Some(42)
```

### Option from Nullable

Transform null/undefined to Option:

```typescript
import { Schema } from "effect"

// null → None, value → Some(value)
const FromNull = Schema.OptionFromNullOr(Schema.String)

Schema.decodeSync(FromNull)(null)     // None
Schema.decodeSync(FromNull)("hello")  // Some("hello")

// undefined → None
const FromUndefined = Schema.OptionFromUndefinedOr(Schema.String)

Schema.decodeSync(FromUndefined)(undefined)  // None
Schema.decodeSync(FromUndefined)("hello")    // Some("hello")

// null or undefined → None
const FromNullish = Schema.OptionFromNullishOr(
  Schema.String,
  null  // or undefined, for encoding None
)

Schema.decodeSync(FromNullish)(null)       // None
Schema.decodeSync(FromNullish)(undefined)  // None
Schema.decodeSync(FromNullish)("hello")    // Some("hello")
```

### Option in Structs

Using Option in struct properties:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
  
  // Optional as Option type
  phone: Schema.optional(Schema.String, { as: "Option" }),
  
  // Or explicit transformation
  nickname: Schema.OptionFromNullOr(Schema.String)
})

type User = typeof User.Type
// {
//   readonly name: string
//   readonly email: string
//   readonly phone: Option<string>
//   readonly nickname: Option<string>
// }
```

## Property Signature Transformations

For complex optional scenarios, use property signature transformations:

### optionalToRequired

Transform optional encoded to required type:

```typescript
import { Schema } from "effect"
import { Option } from "effect"

const Schema1 = Schema.Struct({
  // Encoded: optional string
  // Type: required string with default
  name: Schema.optionalToRequired(
    Schema.String,
    Schema.String,
    {
      decode: (o) => Option.getOrElse(o, () => "Anonymous"),
      encode: (s) => Option.some(s)
    }
  )
})
```

### requiredToOptional

Transform required encoded to optional type:

```typescript
import { Schema } from "effect"
import { Option } from "effect"

const Schema2 = Schema.Struct({
  // Encoded: required string (empty string means absent)
  // Type: optional string
  name: Schema.requiredToOptional(
    Schema.String,
    Schema.String,
    {
      decode: (s) => s === "" ? Option.none() : Option.some(s),
      encode: (o) => Option.getOrElse(o, () => "")
    }
  )
})
```

## Practical Examples

### API Response Handling

```typescript
import { Schema } from "effect"

const UserResponse = Schema.Struct({
  id: Schema.String,
  username: Schema.String,
  
  // API returns null for missing values
  email: Schema.NullOr(Schema.String),
  phone: Schema.NullOr(Schema.String),
  
  // Transform nulls to Option
  avatar: Schema.OptionFromNullOr(Schema.String),
  
  // Optional with default
  locale: Schema.optional(Schema.String, { default: () => "en" })
})
```

### Form Data

```typescript
import { Schema } from "effect"

const FormData = Schema.Struct({
  // Required fields
  email: Schema.String,
  password: Schema.String,
  
  // Optional fields - empty string becomes absent
  firstName: Schema.optional(
    Schema.String.pipe(Schema.nonEmptyString()),
    { exact: true }
  ),
  lastName: Schema.optional(
    Schema.String.pipe(Schema.nonEmptyString()),
    { exact: true }
  ),
  
  // Checkbox - missing means false
  acceptTerms: Schema.optional(Schema.Boolean, { default: () => false })
})
```

### Database Records

```typescript
import { Schema } from "effect"

const DbUser = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  
  // Nullable database columns
  deleted_at: Schema.NullOr(Schema.DateFromString),
  verified_at: Schema.NullOr(Schema.DateFromString),
  
  // Optional JSON fields (stored as null when empty)
  preferences: Schema.OptionFromNullOr(
    Schema.Struct({
      theme: Schema.String,
      notifications: Schema.Boolean
    })
  )
})
```

## Summary

| Pattern | Input Accepts | Type Output |
|---------|--------------|-------------|
| `optional(S)` | missing, undefined | `T \| undefined` |
| `optional(S, { exact: true })` | missing only | `T` (optional) |
| `optional(S, { default: () => v })` | missing, undefined | `T` (required) |
| `optional(S, { nullable: true })` | missing, undefined, null | `T \| undefined` |
| `optional(S, { as: "Option" })` | missing, undefined | `Option<T>` |
| `NullOr(S)` | value, null | `T \| null` |
| `UndefinedOr(S)` | value, undefined | `T \| undefined` |
| `NullishOr(S)` | value, null, undefined | `T \| null \| undefined` |
| `OptionFromNullOr(S)` | value, null | `Option<T>` |

## Next Steps

- [Filters](/guide/filters) - Validation rules
- [Transformations](/guide/transformations) - Type conversions
- [Error Messages](/guide/error-messages) - Custom error handling

