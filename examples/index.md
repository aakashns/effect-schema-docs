---
title: Examples
description: Practical examples of Effect Schema in real-world scenarios
---

# Examples

Learn Effect Schema through practical, real-world examples. Each example demonstrates common patterns and best practices you'll encounter in production applications.

## What You'll Learn

These examples cover a range of use cases from simple API validation to complex domain modeling:

<div class="examples-grid">

### [API Validation](/examples/api-validation)
Build type-safe REST APIs with request/response validation, pagination, and error handling.

### [Form Validation](/examples/form-validation)
Integrate Schema with React Hook Form for client-side validation with custom error messages.

### [Configuration](/examples/configuration)
Parse environment variables and configuration files with automatic type coercion.

### [Domain Modeling](/examples/domain-modeling)
Model complex business domains with branded types, state machines, and discriminated unions.

### [Database Integration](/examples/database-integration)
Transform between database representations and application types with Prisma.

### [WebSocket Messages](/examples/websocket-messages)
Create type-safe bidirectional communication protocols for real-time applications.

</div>

## Prerequisites

These examples assume you have:

- Basic familiarity with TypeScript
- Read the [Quick Start](/guide/quick-start) guide
- Understanding of [Core Concepts](/guide/core-concepts)

## Running the Examples

All examples can be run in a TypeScript project with Effect installed:

```bash
npm install effect
```

Then create a `.ts` file and copy the example code. Most examples are self-contained and can be run directly with `ts-node` or `tsx`:

```bash
npx tsx example.ts
```

## More Resources

- [Effect Examples Repository](https://github.com/Effect-TS/effect/tree/main/packages/effect/examples) - Official examples
- [Discord Community](https://discord.gg/effect-ts) - Ask questions and share examples
- [Best Practices](/best-practices/) - Schema design patterns

<style>
.examples-grid h3 {
  margin-top: 1.5rem;
}
.examples-grid h3 a {
  text-decoration: none;
}
.examples-grid p {
  color: var(--vp-c-text-2);
  margin-top: 0.5rem;
}
</style>
