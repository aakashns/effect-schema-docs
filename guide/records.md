---
title: Records
description: Learn how to define dynamic key-value objects in Effect Schema
---

# Records

Records define objects with dynamic keys. Unlike structs where you know the exact property names, records let you specify the type of keys and values without knowing the specific keys in advance.

## Basic Record

Create a record with string keys:

```typescript
import { Schema } from "effect"

const StringRecord = Schema.Record({
  key: Schema.String,
  value: Schema.Number
})
// Schema<{ readonly [x: string]: number }>

type StringRecord = typeof StringRecord.Type
// { readonly [x: string]: number }

Schema.decodeUnknownSync(StringRecord)({})                    // ✅ {}
Schema.decodeUnknownSync(StringRecord)({ a: 1, b: 2 })        // ✅
Schema.decodeUnknownSync(StringRecord)({ a: "string" })       // ❌ ParseError
```

## Key Types

Records support different key types:

### String Keys

```typescript
import { Schema } from "effect"

const StringKeyed = Schema.Record({
  key: Schema.String,
  value: Schema.Boolean
})
// { readonly [x: string]: boolean }
```

### Template Literal Keys

Restrict keys to a specific pattern:

```typescript
import { Schema } from "effect"

const PrefixedRecord = Schema.Record({
  key: Schema.TemplateLiteral("user_", Schema.String),
  value: Schema.Number
})
// { readonly [x: `user_${string}`]: number }

Schema.decodeUnknownSync(PrefixedRecord)({ user_123: 1 })    // ✅
Schema.decodeUnknownSync(PrefixedRecord)({ admin_123: 1 })   // ❌ Key doesn't match
```

### Union Keys

Limit keys to specific values:

```typescript
import { Schema } from "effect"

const SizeRecord = Schema.Record({
  key: Schema.Literal("small", "medium", "large"),
  value: Schema.Number
})
// { readonly small: number; readonly medium: number; readonly large: number }

Schema.decodeUnknownSync(SizeRecord)({
  small: 10,
  medium: 20,
  large: 30
})  // ✅

// Note: All keys must be present
Schema.decodeUnknownSync(SizeRecord)({ small: 10 })  // ❌ Missing keys
```

### Symbol Keys

```typescript
import { Schema } from "effect"

const SymbolRecord = Schema.Record({
  key: Schema.SymbolFromSelf,
  value: Schema.String
})
// { readonly [x: symbol]: string }
```

### Number Keys

```typescript
import { Schema } from "effect"

// NumberFromString as key (for string → number conversion)
const NumberRecord = Schema.Record({
  key: Schema.NumberFromString,
  value: Schema.String
})

// Keys are validated as numbers but remain strings in JavaScript
Schema.decodeUnknownSync(NumberRecord)({ "1": "a", "2": "b" })  // ✅
Schema.decodeUnknownSync(NumberRecord)({ "abc": "x" })          // ❌ Invalid key
```

## Combining with Structs

Mix fixed properties with dynamic ones:

```typescript
import { Schema } from "effect"

// Fixed properties plus additional dynamic properties
const Config = Schema.Struct({
  name: Schema.String,
  version: Schema.Number
}).pipe(
  Schema.extend(
    Schema.Record({
      key: Schema.String,
      value: Schema.Unknown
    })
  )
)

type Config = typeof Config.Type
// { 
//   readonly name: string
//   readonly version: number
//   readonly [x: string]: unknown
// }

Schema.decodeUnknownSync(Config)({
  name: "myapp",
  version: 1,
  debug: true,
  timeout: 5000
})  // ✅
```

## Value Types

Record values can be any schema:

```typescript
import { Schema } from "effect"

// Primitive values
const StringValues = Schema.Record({
  key: Schema.String,
  value: Schema.String
})

// Object values
const UserMap = Schema.Record({
  key: Schema.String,
  value: Schema.Struct({
    name: Schema.String,
    email: Schema.String
  })
})

// Array values
const TagsMap = Schema.Record({
  key: Schema.String,
  value: Schema.Array(Schema.String)
})

// Union values
const MixedMap = Schema.Record({
  key: Schema.String,
  value: Schema.Union(Schema.String, Schema.Number, Schema.Boolean)
})
```

## Optional Values

Handle optional values in records:

```typescript
import { Schema } from "effect"

// Values can be undefined
const OptionalRecord = Schema.Record({
  key: Schema.String,
  value: Schema.UndefinedOr(Schema.Number)
})
// { readonly [x: string]: number | undefined }

// Or use Option
const OptionRecord = Schema.Record({
  key: Schema.String,
  value: Schema.OptionFromNullOr(Schema.Number)
})
// { readonly [x: string]: Option<number> }
```

## Nested Records

Records can be nested:

```typescript
import { Schema } from "effect"

const NestedConfig = Schema.Record({
  key: Schema.String,
  value: Schema.Record({
    key: Schema.String,
    value: Schema.String
  })
})

type NestedConfig = typeof NestedConfig.Type
// { readonly [x: string]: { readonly [x: string]: string } }

Schema.decodeUnknownSync(NestedConfig)({
  database: {
    host: "localhost",
    port: "5432"
  },
  cache: {
    host: "localhost",
    ttl: "3600"
  }
})  // ✅
```

## Practical Examples

### Configuration Object

```typescript
import { Schema } from "effect"

const EnvConfig = Schema.Record({
  key: Schema.String.pipe(
    Schema.pattern(/^[A-Z][A-Z0-9_]*$/)  // ENV_VAR_FORMAT
  ),
  value: Schema.String
})

Schema.decodeUnknownSync(EnvConfig)({
  DATABASE_URL: "postgres://...",
  API_KEY: "secret",
  DEBUG_MODE: "true"
})  // ✅
```

### Feature Flags

```typescript
import { Schema } from "effect"

const FeatureFlags = Schema.Record({
  key: Schema.String.pipe(Schema.pattern(/^[a-z][a-z0-9_]*$/)),
  value: Schema.Struct({
    enabled: Schema.Boolean,
    rolloutPercentage: Schema.optional(
      Schema.Number.pipe(Schema.between(0, 100))
    ),
    enabledFor: Schema.optional(Schema.Array(Schema.String))
  })
})

Schema.decodeUnknownSync(FeatureFlags)({
  dark_mode: { enabled: true },
  new_checkout: { enabled: true, rolloutPercentage: 50 },
  beta_features: { enabled: false, enabledFor: ["user_123", "user_456"] }
})  // ✅
```

### Translation Dictionary

```typescript
import { Schema } from "effect"

const Language = Schema.Literal("en", "es", "fr", "de")

const Translations = Schema.Record({
  key: Language,
  value: Schema.Record({
    key: Schema.String,
    value: Schema.String
  })
})

Schema.decodeUnknownSync(Translations)({
  en: { greeting: "Hello", farewell: "Goodbye" },
  es: { greeting: "Hola", farewell: "Adiós" },
  fr: { greeting: "Bonjour", farewell: "Au revoir" },
  de: { greeting: "Hallo", farewell: "Auf Wiedersehen" }
})  // ✅
```

### Metrics Store

```typescript
import { Schema } from "effect"

const MetricValue = Schema.Union(
  Schema.Struct({
    type: Schema.Literal("counter"),
    value: Schema.Number
  }),
  Schema.Struct({
    type: Schema.Literal("gauge"),
    value: Schema.Number,
    unit: Schema.String
  }),
  Schema.Struct({
    type: Schema.Literal("histogram"),
    buckets: Schema.Array(Schema.Number),
    count: Schema.Number
  })
)

const MetricsStore = Schema.Record({
  key: Schema.String,
  value: MetricValue
})
```

### API Query Parameters

```typescript
import { Schema } from "effect"

const QueryParams = Schema.Record({
  key: Schema.String,
  value: Schema.Union(
    Schema.String,
    Schema.Array(Schema.String)  // For repeated params like ?tag=a&tag=b
  )
})

Schema.decodeUnknownSync(QueryParams)({
  page: "1",
  limit: "20",
  tags: ["typescript", "effect"]
})  // ✅
```

## Record vs Struct

| Aspect | Struct | Record |
|--------|--------|--------|
| Keys | Known at compile time | Dynamic |
| Type | `{ a: T, b: U }` | `{ [k: K]: V }` |
| Validation | Per-property | Key type + value type |
| Optional fields | `Schema.optional()` | Via union value type |
| Use case | Fixed schemas | Dynamic data |

Choose **Struct** when you know the exact properties. Choose **Record** when keys are dynamic or unknown at compile time.

## Summary

| Pattern | Type |
|---------|------|
| `Record({ key: String, value: T })` | `{ [x: string]: T }` |
| `Record({ key: Literal(...), value: T })` | `{ key1: T, key2: T, ... }` |
| `Record({ key: TemplateLiteral(...), value: T })` | `{ [x: pattern]: T }` |
| `Struct({...}).pipe(extend(Record(...)))` | Fixed + dynamic |

## Next Steps

- [Optional & Nullable](/guide/optional-nullable) - Handling missing values
- [Filters](/guide/filters) - Validation rules
- [Transformations](/guide/transformations) - Type conversions

