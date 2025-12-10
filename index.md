---
layout: home
title: Effect Schema
titleTemplate: Type-safe Validation & Transformation

hero:
  name: Effect Schema
  text: Type-safe Validation & Transformation
  tagline: Define once. Decode, validate, encode, and transform data with full TypeScript inference. From the creators of Effect.
  image:
    src: /hero-image.svg
    alt: Effect Schema
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/Effect-TS/effect/tree/main/packages/effect/src/Schema.ts

features:
  - icon: 🎯
    title: Bidirectional by Design
    details: Unlike other validation libraries, Schema handles both decoding (external → internal) and encoding (internal → external) with a single definition. Parse JSON, serialize to databases, or transform API responses seamlessly.
    
  - icon: 🔒
    title: Type-Safe from End to End
    details: Full TypeScript inference with zero runtime overhead. Your types are automatically derived from your schemas, eliminating type drift and ensuring compile-time safety.
    
  - icon: ⚡
    title: Effect Integration
    details: Seamlessly integrates with Effect for async validation, dependency injection, and error handling. Or use it standalone with sync/promise APIs—no Effect knowledge required.
    
  - icon: 🧩
    title: Composable & Extensible
    details: Build complex schemas from simple building blocks. Extend, transform, and refine schemas with a powerful composition model that scales with your application.
    
  - icon: 📋
    title: Rich Ecosystem
    details: Generate JSON Schema, create property-based tests with fast-check, pretty-print values, derive equality functions—all from the same schema definition.
    
  - icon: 🚀
    title: Battle-Tested
    details: Used in production by companies worldwide. Comprehensive test suite, active maintenance, and a growing community of contributors.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #8B5CF6 10%, #06B6D4 50%, #10B981 90%);
}

.VPHero .tagline {
  max-width: 600px;
  margin: 24px auto 32px;
}
</style>

## Quick Example

```typescript
import { Schema } from "effect"

// Define a schema
const User = Schema.Struct({
  name: Schema.String,
  email: Schema.String.pipe(Schema.pattern(/@/)),
  age: Schema.Number.pipe(Schema.int(), Schema.between(0, 120))
})

// TypeScript infers the type automatically
type User = typeof User.Type
// { readonly name: string; readonly email: string; readonly age: number }

// Decode unknown data safely
const result = Schema.decodeUnknownSync(User)({
  name: "Alice",
  email: "alice@example.com",
  age: 30
})

// Encode back to plain objects
const encoded = Schema.encodeSync(User)(result)
```

## Why Effect Schema?

### Beyond Simple Validation

Most validation libraries stop at "is this valid?". Effect Schema goes further:

- **Decode**: Transform external data into your internal types (e.g., string dates → Date objects)
- **Validate**: Check data already in your internal format
- **Encode**: Transform internal types back to external formats (e.g., Date objects → ISO strings)

### The Type/Encoded Duality

Every schema in Effect Schema has two types:

- **Type** (`A`): Your application's internal representation
- **Encoded** (`I`): The external/serialized representation

```typescript
import { Schema } from "effect"

// Schema<Date, string> — Type is Date, Encoded is string
const DateFromString = Schema.DateFromString

// Decode: string → Date
Schema.decodeSync(DateFromString)("2024-01-15") // Date object

// Encode: Date → string
Schema.encodeSync(DateFromString)(new Date()) // "2024-01-15T..."
```

This bidirectional design means you define your transformations once and get both directions automatically.

## Ready to Start?

<div style="display: flex; gap: 16px; margin-top: 24px;">
  <a href="/guide/introduction" style="display: inline-flex; align-items: center; padding: 12px 24px; background: var(--vp-c-brand-1); color: white; border-radius: 8px; font-weight: 600; text-decoration: none;">
    Read the Guide →
  </a>
  <a href="/zod-comparison/" style="display: inline-flex; align-items: center; padding: 12px 24px; background: var(--vp-c-bg-soft); border-radius: 8px; font-weight: 600; text-decoration: none;">
    Coming from Zod?
  </a>
</div>

