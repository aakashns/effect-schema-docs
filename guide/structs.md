---
title: Structs
description: Learn how to define object schemas with Struct in Effect Schema
---

# Structs

Structs are the workhorse of Effect Schema. They define the shape of objects with specific properties.

## Basic Struct

Define an object schema with `Schema.Struct`:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  age: Schema.Number
})

type User = typeof User.Type
// {
//   readonly id: string
//   readonly name: string
//   readonly email: string
//   readonly age: number
// }
```

::: tip Properties are readonly
By default, struct properties are typed as `readonly`. This aligns with functional programming best practices and prevents accidental mutations.
:::

## Property Types

Struct properties can be any schema:

```typescript
import { Schema } from "effect"

const ComplexStruct = Schema.Struct({
  // Primitives
  name: Schema.String,
  count: Schema.Number,
  active: Schema.Boolean,
  
  // With refinements
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  age: Schema.Number.pipe(Schema.int(), Schema.between(0, 150)),
  
  // Literals
  role: Schema.Literal("admin", "user"),
  
  // Nested structs
  address: Schema.Struct({
    street: Schema.String,
    city: Schema.String
  }),
  
  // Arrays
  tags: Schema.Array(Schema.String),
  
  // Transformations
  createdAt: Schema.DateFromString
})
```

## Optional Properties

Use `Schema.optional` for properties that may be missing:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  nickname: Schema.optional(Schema.String),
  bio: Schema.optional(Schema.String)
})

type User = typeof User.Type
// {
//   readonly id: string
//   readonly name: string
//   readonly nickname?: string | undefined
//   readonly bio?: string | undefined
// }

// Both valid:
Schema.decodeUnknownSync(User)({ id: "1", name: "Alice" })
Schema.decodeUnknownSync(User)({ 
  id: "1", 
  name: "Alice", 
  nickname: "Ali",
  bio: undefined 
})
```

### Optional Variants

`Schema.optional` has several variants for different behaviors:

```typescript
import { Schema } from "effect"

const Example = Schema.Struct({
  // Standard optional - accepts missing or undefined
  a: Schema.optional(Schema.String),
  // Type: string | undefined, may be omitted
  
  // Exact optional - missing only, no undefined
  b: Schema.optional(Schema.String, { exact: true }),
  // Type: string, may be omitted (but if present, must be string)
  
  // With default value
  c: Schema.optional(Schema.String, { default: () => "default" }),
  // Type: string (always present after decode)
  
  // Nullable optional
  d: Schema.optional(Schema.String, { nullable: true }),
  // Type: string | undefined, Encoded accepts null
  
  // As Option
  e: Schema.optional(Schema.String, { as: "Option" }),
  // Type: Option<string>
})
```

### Default Values

Provide default values for optional properties:

```typescript
import { Schema } from "effect"

const Settings = Schema.Struct({
  theme: Schema.optional(Schema.String, { 
    default: () => "light" 
  }),
  fontSize: Schema.optional(Schema.Number, { 
    default: () => 14 
  }),
  notifications: Schema.optional(Schema.Boolean, { 
    default: () => true 
  })
})

type Settings = typeof Settings.Type
// {
//   readonly theme: string
//   readonly fontSize: number
//   readonly notifications: boolean
// }

// Defaults are applied
const settings = Schema.decodeUnknownSync(Settings)({})
// { theme: "light", fontSize: 14, notifications: true }

// Provided values override defaults
const custom = Schema.decodeUnknownSync(Settings)({ theme: "dark" })
// { theme: "dark", fontSize: 14, notifications: true }
```

## Property Signatures

For more control, use `Schema.propertySignature`:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.propertySignature(Schema.String).annotations({
    description: "Unique user identifier"
  }),
  
  email: Schema.propertySignature(Schema.String).annotations({
    description: "Primary email address"
  })
})
```

### From Different Keys

Map between different property names in Type and Encoded:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  // Encoded has "user_name", Type has "userName"
  userName: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey("user_name")
  ),
  
  // Encoded has "created_at", Type has "createdAt"  
  createdAt: Schema.propertySignature(Schema.DateFromString).pipe(
    Schema.fromKey("created_at")
  )
})

// Decode from API format
const user = Schema.decodeUnknownSync(User)({
  user_name: "alice",
  created_at: "2024-01-15T10:30:00Z"
})
// { userName: "alice", createdAt: Date }

// Encode back to API format
const encoded = Schema.encodeSync(User)(user)
// { user_name: "alice", created_at: "2024-01-15T10:30:00.000Z" }
```

## Extracting Type and Encoded

Access the Type and Encoded types:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  createdAt: Schema.DateFromString
})

// The internal/application type
type User = typeof User.Type
// { readonly name: string; readonly createdAt: Date }

// The external/encoded type
type UserEncoded = typeof User.Encoded
// { readonly name: string; readonly createdAt: string }
```

## Struct Operations

### Pick

Select specific properties:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  password: Schema.String
})

// Pick only id and name
const PublicUser = User.pipe(Schema.pick("id", "name"))

type PublicUser = typeof PublicUser.Type
// { readonly id: string; readonly name: string }
```

### Omit

Remove specific properties:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  password: Schema.String
})

// Remove password
const SafeUser = User.pipe(Schema.omit("password"))

type SafeUser = typeof SafeUser.Type
// { readonly id: string; readonly name: string; readonly email: string }
```

### Partial

Make all properties optional:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String
})

const PartialUser = Schema.partial(User)

type PartialUser = typeof PartialUser.Type
// {
//   readonly id?: string | undefined
//   readonly name?: string | undefined
//   readonly email?: string | undefined
// }

// For exact partial (no undefined allowed)
const ExactPartialUser = Schema.partialWith(User, { exact: true })
```

### Required

Make all properties required:

```typescript
import { Schema } from "effect"

const PartialUser = Schema.Struct({
  id: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String)
})

const RequiredUser = Schema.required(PartialUser)

type RequiredUser = typeof RequiredUser.Type
// { readonly id: string; readonly name: string }
```

### Extend

Extend a struct with additional properties:

```typescript
import { Schema } from "effect"

const BaseUser = Schema.Struct({
  id: Schema.String,
  name: Schema.String
})

const AdminUser = BaseUser.pipe(
  Schema.extend(Schema.Struct({
    role: Schema.Literal("admin"),
    permissions: Schema.Array(Schema.String)
  }))
)

type AdminUser = typeof AdminUser.Type
// {
//   readonly id: string
//   readonly name: string
//   readonly role: "admin"
//   readonly permissions: readonly string[]
// }
```

### Mutable

Remove readonly from properties:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String
})

const MutableUser = Schema.mutable(User)

type MutableUser = typeof MutableUser.Type
// { id: string; name: string }  // No readonly!
```

## Pluck

Extract a single property from a struct:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  profile: Schema.Struct({
    name: Schema.String,
    avatar: Schema.String
  })
})

// Extract just the name from profile
const ProfileName = User.pipe(Schema.pluck("profile"))
// Schema<{ name: string, avatar: string }, { profile: { name: string, avatar: string } }>
```

## Rename

Rename properties:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  firstName: Schema.String,
  lastName: Schema.String
})

const RenamedUser = User.pipe(
  Schema.rename({
    firstName: "first_name",
    lastName: "last_name"
  })
)

type RenamedUser = typeof RenamedUser.Type
// { readonly first_name: string; readonly last_name: string }
```

## Tagged Structs

Add a discriminant tag to structs (useful for unions):

```typescript
import { Schema } from "effect"

// Using TaggedStruct
const Circle = Schema.TaggedStruct("Circle", {
  radius: Schema.Number
})
// Equivalent to: { _tag: "Circle", radius: number }

// Using tag helper
const Rectangle = Schema.Struct({
  _tag: Schema.tag("Rectangle"),
  width: Schema.Number,
  height: Schema.Number
})

// Or attach a tag to existing struct
const Triangle = Schema.Struct({
  base: Schema.Number,
  height: Schema.Number
}).pipe(Schema.attachPropertySignature("_tag", "Triangle"))
```

## Constructor (make)

Structs provide a `make` function for creating instances:

```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String
})

// Create with make (validates by default)
const user = User.make({
  id: "1",
  name: "Alice",
  email: "alice@example.com"
})

// Skip validation (use with caution)
const userUnsafe = User.make(
  { id: "1", name: "Alice", email: "invalid" },
  { disableValidation: true }
)
```

## Nested Structs

Structs can be nested arbitrarily:

```typescript
import { Schema } from "effect"

const Address = Schema.Struct({
  street: Schema.String,
  city: Schema.String,
  country: Schema.String,
  postalCode: Schema.String
})

const ContactInfo = Schema.Struct({
  email: Schema.String,
  phone: Schema.optional(Schema.String),
  address: Address
})

const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  contact: ContactInfo
})

// Deep nesting works seamlessly
const user = Schema.decodeUnknownSync(User)({
  id: "1",
  name: "Alice",
  contact: {
    email: "alice@example.com",
    address: {
      street: "123 Main St",
      city: "Springfield",
      country: "USA",
      postalCode: "12345"
    }
  }
})
```

## Best Practices

### 1. Define Reusable Schemas

```typescript
import { Schema } from "effect"

// Reusable schemas
const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("Email")
)

const UserId = Schema.String.pipe(Schema.brand("UserId"))

// Use in structs
const User = Schema.Struct({
  id: UserId,
  email: Email
})
```

### 2. Keep Structs Focused

```typescript
// ❌ God struct with everything
const Everything = Schema.Struct({
  userId: Schema.String,
  userName: Schema.String,
  orderId: Schema.String,
  orderTotal: Schema.Number,
  // ... 50 more fields
})

// ✅ Separate concerns
const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String
})

const Order = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  total: Schema.Number
})
```

### 3. Use Type Aliases

```typescript
import { Schema } from "effect"

const UserSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String
})

// Export both the schema and type
type User = typeof UserSchema.Type
export { UserSchema, type User }
```

## Summary

| Operation | Description |
|-----------|-------------|
| `Schema.Struct({...})` | Define object schema |
| `Schema.optional(s)` | Make property optional |
| `Schema.pick(...keys)` | Select properties |
| `Schema.omit(...keys)` | Remove properties |
| `Schema.partial(s)` | Make all optional |
| `Schema.required(s)` | Make all required |
| `Schema.extend(s)` | Add properties |
| `Schema.mutable(s)` | Remove readonly |
| `Schema.rename({...})` | Rename properties |
| `Schema.fromKey(key)` | Map encoded key |

## Next Steps

- [Arrays & Tuples](/guide/arrays-tuples) - Collection schemas
- [Records](/guide/records) - Dynamic key-value schemas
- [Unions](/guide/unions) - Discriminated unions

