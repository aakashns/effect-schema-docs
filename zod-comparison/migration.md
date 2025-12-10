---
title: Migration Guide
description: Migrate from Zod to Effect Schema - step by step guide with code examples
---

# Migration Guide: Zod to Effect Schema

This guide helps you migrate from Zod to Effect Schema. We'll cover common patterns and their Effect Schema equivalents.

## Installation

First, install Effect:

```bash
npm install effect
```

Update your imports:

```typescript
// Before (Zod)
import { z } from "zod"

// After (Effect Schema)
import { Schema } from "effect"
```

## Primitives

### Strings

::: code-group

```typescript [Zod]
z.string()
z.string().min(1)
z.string().max(100)
z.string().length(5)
z.string().email()
z.string().url()
z.string().uuid()
z.string().regex(/pattern/)
z.string().startsWith("prefix")
z.string().endsWith("suffix")
z.string().trim()
z.string().toLowerCase()
z.string().toUpperCase()
```

```typescript [Effect Schema]
Schema.String
Schema.String.pipe(Schema.minLength(1))  // or Schema.NonEmptyString
Schema.String.pipe(Schema.maxLength(100))
Schema.String.pipe(Schema.length(5))
Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
Schema.String.pipe(Schema.pattern(/^https?:\/\/.+/))
Schema.UUID
Schema.String.pipe(Schema.pattern(/pattern/))
Schema.String.pipe(Schema.startsWith("prefix"))
Schema.String.pipe(Schema.endsWith("suffix"))
Schema.Trim  // transformation
Schema.Lowercase  // transformation
Schema.Uppercase  // transformation
```

:::

### Numbers

::: code-group

```typescript [Zod]
z.number()
z.number().int()
z.number().positive()
z.number().negative()
z.number().nonnegative()
z.number().nonpositive()
z.number().min(5)
z.number().max(10)
z.number().finite()
z.number().safe()
```

```typescript [Effect Schema]
Schema.Number
Schema.Number.pipe(Schema.int())  // or Schema.Int
Schema.Number.pipe(Schema.positive())  // or Schema.Positive
Schema.Number.pipe(Schema.negative())  // or Schema.Negative
Schema.Number.pipe(Schema.nonNegative())  // or Schema.NonNegative
Schema.Number.pipe(Schema.nonPositive())  // or Schema.NonPositive
Schema.Number.pipe(Schema.greaterThanOrEqualTo(5))
Schema.Number.pipe(Schema.lessThanOrEqualTo(10))
Schema.Number.pipe(Schema.finite())  // or Schema.Finite
Schema.Number.pipe(Schema.int())  // Safe integers via int()
```

:::

### Booleans and Others

::: code-group

```typescript [Zod]
z.boolean()
z.bigint()
z.date()
z.undefined()
z.null()
z.void()
z.any()
z.unknown()
z.never()
```

```typescript [Effect Schema]
Schema.Boolean
Schema.BigIntFromSelf  // or Schema.BigInt for string→bigint
Schema.DateFromSelf  // or Schema.DateFromString
Schema.Undefined
Schema.Null
Schema.Void
Schema.Any  // avoid if possible
Schema.Unknown
Schema.Never
```

:::

## Objects

::: code-group

```typescript [Zod]
const User = z.object({
  name: z.string(),
  age: z.number()
})

// Partial
User.partial()

// Required
User.required()

// Pick
User.pick({ name: true })

// Omit
User.omit({ age: true })

// Extend
User.extend({ email: z.string() })

// Merge
User.merge(OtherSchema)

// Strict (no extra keys)
z.object({}).strict()
```

```typescript [Effect Schema]
const User = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})

// Partial
Schema.partial(User)

// Required
Schema.required(User)

// Pick
User.pipe(Schema.pick("name"))

// Omit
User.pipe(Schema.omit("age"))

// Extend
User.pipe(Schema.extend(Schema.Struct({ email: Schema.String })))

// Merge (use extend)
User.pipe(Schema.extend(OtherSchema))

// Strict (use onExcessProperty option)
Schema.decodeUnknownSync(User)(data, { onExcessProperty: "error" })
```

:::

## Arrays

::: code-group

```typescript [Zod]
z.array(z.string())
z.array(z.string()).nonempty()
z.array(z.string()).min(1)
z.array(z.string()).max(10)
z.array(z.string()).length(5)
z.tuple([z.string(), z.number()])
```

```typescript [Effect Schema]
Schema.Array(Schema.String)
Schema.NonEmptyArray(Schema.String)
Schema.Array(Schema.String).pipe(Schema.minItems(1))
Schema.Array(Schema.String).pipe(Schema.maxItems(10))
Schema.Array(Schema.String).pipe(Schema.itemsCount(5))
Schema.Tuple(Schema.String, Schema.Number)
```

:::

## Unions

::: code-group

```typescript [Zod]
z.union([z.string(), z.number()])
z.string().or(z.number())

z.discriminatedUnion("type", [
  z.object({ type: z.literal("a"), value: z.string() }),
  z.object({ type: z.literal("b"), count: z.number() })
])
```

```typescript [Effect Schema]
Schema.Union(Schema.String, Schema.Number)
// Same as above

Schema.Union(
  Schema.Struct({ type: Schema.Literal("a"), value: Schema.String }),
  Schema.Struct({ type: Schema.Literal("b"), count: Schema.Number })
)
```

:::

## Literals and Enums

::: code-group

```typescript [Zod]
z.literal("active")
z.literal(42)

z.enum(["pending", "active", "done"])

enum Status { Pending, Active, Done }
z.nativeEnum(Status)
```

```typescript [Effect Schema]
Schema.Literal("active")
Schema.Literal(42)

Schema.Literal("pending", "active", "done")

enum Status { Pending, Active, Done }
Schema.Enums(Status)
```

:::

## Optional and Nullable

::: code-group

```typescript [Zod]
z.string().optional()        // string | undefined
z.string().nullable()        // string | null
z.string().nullish()         // string | null | undefined
z.string().default("hi")     // defaults to "hi"
```

```typescript [Effect Schema]
Schema.optional(Schema.String)        // string | undefined
Schema.NullOr(Schema.String)          // string | null
Schema.NullishOr(Schema.String)       // string | null | undefined
Schema.optional(Schema.String, { default: () => "hi" })
```

:::

## Records

::: code-group

```typescript [Zod]
z.record(z.string())               // Record<string, string>
z.record(z.string(), z.number())   // Record<string, number>
```

```typescript [Effect Schema]
Schema.Record({ key: Schema.String, value: Schema.String })
Schema.Record({ key: Schema.String, value: Schema.Number })
```

:::

## Refinements

::: code-group

```typescript [Zod]
z.string().refine(
  (s) => s.length > 0,
  "Must not be empty"
)

z.string().superRefine((s, ctx) => {
  if (s.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Must not be empty"
    })
  }
})
```

```typescript [Effect Schema]
Schema.String.pipe(
  Schema.filter((s) => s.length > 0, {
    message: () => "Must not be empty"
  })
)

// For multiple issues, use filterEffect
Schema.String.pipe(
  Schema.filter((s) => {
    if (s.length === 0) return "Must not be empty"
    if (!/[A-Z]/.test(s)) return "Must contain uppercase"
    return true
  })
)
```

:::

## Transformations

::: code-group

```typescript [Zod]
z.string().transform((s) => s.length)

z.coerce.number()  // coerce to number
z.coerce.date()    // coerce to date
```

```typescript [Effect Schema]
// Effect Schema transformations are bidirectional
Schema.transform(
  Schema.String,
  Schema.Number,
  {
    decode: (s) => s.length,
    encode: (n) => "x".repeat(n)  // Must provide reverse
  }
)

Schema.NumberFromString  // string ↔ number
Schema.DateFromString    // string ↔ Date
```

:::

## Parsing Methods

::: code-group

```typescript [Zod]
schema.parse(data)           // throws on error
schema.safeParse(data)       // returns { success, data/error }
schema.parseAsync(data)      // async version
schema.safeParseAsync(data)  // async safe version
```

```typescript [Effect Schema]
Schema.decodeUnknownSync(schema)(data)     // throws on error
Schema.decodeUnknownEither(schema)(data)   // returns Either
Schema.decodeUnknownOption(schema)(data)   // returns Option
Schema.decodeUnknownPromise(schema)(data)  // returns Promise
Schema.decodeUnknown(schema)(data)         // returns Effect
```

:::

## Type Inference

::: code-group

```typescript [Zod]
type User = z.infer<typeof UserSchema>
type Input = z.input<typeof UserSchema>
type Output = z.output<typeof UserSchema>
```

```typescript [Effect Schema]
type User = typeof UserSchema.Type      // Output/decoded type
type Input = typeof UserSchema.Encoded  // Input/encoded type
// Type and Encoded replace input/output
```

:::

## Brands

::: code-group

```typescript [Zod]
const UserId = z.string().brand<"UserId">()
type UserId = z.infer<typeof UserId>
```

```typescript [Effect Schema]
const UserId = Schema.String.pipe(Schema.brand("UserId"))
type UserId = typeof UserId.Type
```

:::

## Common Patterns

### API Response Handling

::: code-group

```typescript [Zod]
const ApiResponse = z.object({
  data: UserSchema,
  timestamp: z.string().datetime()
})

async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`)
  const json = await res.json()
  return ApiResponse.parse(json)
}
```

```typescript [Effect Schema]
const ApiResponse = Schema.Struct({
  data: UserSchema,
  timestamp: Schema.DateFromString
})

async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`)
  const json = await res.json()
  return Schema.decodeUnknownSync(ApiResponse)(json)
}

// Encoding for requests
async function updateUser(user: User) {
  const body = Schema.encodeSync(UserSchema)(user)
  await fetch(`/api/users/${user.id}`, {
    method: "PUT",
    body: JSON.stringify(body)
  })
}
```

:::

### Form Validation

::: code-group

```typescript [Zod]
const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

function validateForm(data: unknown) {
  const result = FormSchema.safeParse(data)
  if (!result.success) {
    return result.error.flatten()
  }
  return result.data
}
```

```typescript [Effect Schema]
const FormSchema = Schema.Struct({
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  password: Schema.String.pipe(Schema.minLength(8))
})

function validateForm(data: unknown) {
  const result = Schema.decodeUnknownEither(FormSchema)(data)
  if (Either.isLeft(result)) {
    return ParseResult.ArrayFormatter.formatIssueSync(result.left.issue)
  }
  return result.right
}
```

:::

## Migration Tips

1. **Start with leaf schemas**: Migrate the simplest schemas first
2. **Test encoding**: Effect Schema encodes too—verify your serialization works
3. **Use strict mode**: Enable `onExcessProperty: "error"` to match Zod's strict behavior
4. **Check transforms**: Zod transforms are one-way; Effect Schema needs both directions
5. **Update error handling**: Error formats differ; update error display code
6. **Consider Effect**: If migrating a large codebase, consider adopting Effect for other benefits

## Need Help?

- [Effect Discord](https://discord.gg/effect-ts) - Active community
- [GitHub Issues](https://github.com/Effect-TS/effect/issues) - Bug reports and questions
- [Effect Documentation](https://effect.website) - Full Effect ecosystem docs

