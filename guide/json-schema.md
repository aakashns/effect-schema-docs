---
title: JSON Schema
description: Generate JSON Schema from Effect Schema definitions for API documentation and validation
---

# JSON Schema

Effect Schema can generate [JSON Schema](https://json-schema.org/) from your schema definitions. This is useful for API documentation, OpenAPI specs, and interoperability with other tools.

## Basic Generation

```typescript
import { Schema, JSONSchema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
  email: Schema.String
})

const jsonSchema = JSONSchema.make(User)
```

Output:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" },
    "email": { "type": "string" }
  },
  "required": ["name", "age", "email"],
  "additionalProperties": false
}
```

## Annotations for Better Output

Add metadata using annotations:

```typescript
import { Schema, JSONSchema } from "effect"

const User = Schema.Struct({
  name: Schema.String.annotations({
    title: "User Name",
    description: "The user's full name",
    examples: ["Alice Smith", "Bob Jones"]
  }),
  age: Schema.Number.pipe(
    Schema.int(),
    Schema.between(0, 150)
  ).annotations({
    title: "Age",
    description: "User's age in years"
  }),
  email: Schema.String.annotations({
    title: "Email",
    description: "Primary email address",
    examples: ["user@example.com"]
  })
}).annotations({
  identifier: "User",
  title: "User",
  description: "A registered user in the system"
})

const jsonSchema = JSONSchema.make(User)
```

Output:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$defs": {
    "User": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "title": "User Name",
          "description": "The user's full name",
          "examples": ["Alice Smith", "Bob Jones"]
        },
        "age": {
          "type": "integer",
          "title": "Age",
          "description": "User's age in years",
          "minimum": 0,
          "maximum": 150
        },
        "email": {
          "type": "string",
          "title": "Email",
          "description": "Primary email address",
          "examples": ["user@example.com"]
        }
      },
      "required": ["name", "age", "email"],
      "additionalProperties": false,
      "title": "User",
      "description": "A registered user in the system"
    }
  },
  "$ref": "#/$defs/User"
}
```

## Type Mappings

### Primitives

| Effect Schema | JSON Schema |
|---------------|-------------|
| `Schema.String` | `{ "type": "string" }` |
| `Schema.Number` | `{ "type": "number" }` |
| `Schema.Boolean` | `{ "type": "boolean" }` |
| `Schema.Null` | `{ "type": "null" }` |

### Numbers with Constraints

```typescript
import { Schema, JSONSchema } from "effect"

// Integer
Schema.Number.pipe(Schema.int())
// { "type": "integer" }

// With range
Schema.Number.pipe(Schema.between(0, 100))
// { "type": "number", "minimum": 0, "maximum": 100 }

// Exclusive bounds
Schema.Number.pipe(Schema.greaterThan(0), Schema.lessThan(100))
// { "type": "number", "exclusiveMinimum": 0, "exclusiveMaximum": 100 }
```

### Strings with Constraints

```typescript
import { Schema, JSONSchema } from "effect"

// Length constraints
Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100))
// { "type": "string", "minLength": 1, "maxLength": 100 }

// Pattern
Schema.String.pipe(Schema.pattern(/^[A-Z]+$/))
// { "type": "string", "pattern": "^[A-Z]+$" }

// Format (add via jsonSchema annotation)
Schema.String.annotations({
  jsonSchema: { format: "email" }
})
// { "type": "string", "format": "email" }
```

### Arrays

```typescript
import { Schema, JSONSchema } from "effect"

// Basic array
Schema.Array(Schema.String)
// { "type": "array", "items": { "type": "string" } }

// With constraints
Schema.Array(Schema.String).pipe(
  Schema.minItems(1),
  Schema.maxItems(10)
)
// { "type": "array", "items": { "type": "string" }, "minItems": 1, "maxItems": 10 }

// Tuple
Schema.Tuple(Schema.String, Schema.Number)
// { "type": "array", "prefixItems": [{ "type": "string" }, { "type": "number" }], "items": false }
```

### Unions

```typescript
import { Schema, JSONSchema } from "effect"

// Simple union
Schema.Union(Schema.String, Schema.Number)
// { "anyOf": [{ "type": "string" }, { "type": "number" }] }

// Literals
Schema.Literal("a", "b", "c")
// { "enum": ["a", "b", "c"] }
```

### Optional Properties

```typescript
import { Schema, JSONSchema } from "effect"

Schema.Struct({
  required: Schema.String,
  optional: Schema.optional(Schema.String)
})
// {
//   "type": "object",
//   "properties": {
//     "required": { "type": "string" },
//     "optional": { "type": "string" }
//   },
//   "required": ["required"]  // "optional" not in required array
// }
```

## Custom JSON Schema

Override generated JSON Schema with the `jsonSchema` annotation:

```typescript
import { Schema, JSONSchema } from "effect"

const Email = Schema.String.annotations({
  jsonSchema: {
    type: "string",
    format: "email",
    pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
  }
})

// Output uses your custom schema
JSONSchema.make(Email)
// { "type": "string", "format": "email", "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" }
```

## Handling Transformations

JSON Schema is generated from the **Encoded** side of transformations:

```typescript
import { Schema, JSONSchema } from "effect"

const DateField = Schema.DateFromString
// Type: Date
// Encoded: string

const User = Schema.Struct({
  createdAt: DateField
})

JSONSchema.make(User)
// createdAt is string in JSON Schema (the encoded type)
// {
//   "properties": {
//     "createdAt": { "type": "string" }
//   }
// }
```

For better documentation, add format annotations:

```typescript
const DateField = Schema.DateFromString.annotations({
  jsonSchema: { type: "string", format: "date-time" }
})
```

## Practical Examples

### API Request Schema

```typescript
import { Schema, JSONSchema } from "effect"

const CreateUserRequest = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1),
    Schema.maxLength(100)
  ).annotations({
    description: "User's display name"
  }),
  email: Schema.String.annotations({
    description: "User's email address",
    jsonSchema: { format: "email" }
  }),
  password: Schema.String.pipe(
    Schema.minLength(8)
  ).annotations({
    description: "User's password (min 8 characters)"
  }),
  role: Schema.optional(
    Schema.Literal("admin", "user", "guest")
  ).annotations({
    description: "User's role (defaults to 'user')"
  })
}).annotations({
  identifier: "CreateUserRequest",
  title: "Create User Request",
  description: "Request body for creating a new user"
})

const schema = JSONSchema.make(CreateUserRequest)
```

### OpenAPI Integration

```typescript
import { Schema, JSONSchema } from "effect"

// Define your schemas
const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String
}).annotations({ identifier: "User" })

const CreateUserRequest = Schema.Struct({
  name: Schema.String,
  email: Schema.String
}).annotations({ identifier: "CreateUserRequest" })

// Generate for OpenAPI
const openApiSchemas = {
  User: JSONSchema.make(User),
  CreateUserRequest: JSONSchema.make(CreateUserRequest)
}

// Use in OpenAPI spec
const openApiSpec = {
  openapi: "3.0.0",
  paths: {
    "/users": {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" }
            }
          }
        },
        responses: {
          200: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: openApiSchemas
  }
}
```

## Limitations

Some Effect Schema features don't have JSON Schema equivalents:

1. **Branded types**: Brand information is lost
2. **Effect context**: The `R` parameter isn't represented
3. **Complex transformations**: Only the Encoded type is shown
4. **Refinements with custom logic**: Become simple type constraints

For these cases, use the `jsonSchema` annotation to provide documentation:

```typescript
const UserId = Schema.String.pipe(
  Schema.brand("UserId")
).annotations({
  jsonSchema: {
    type: "string",
    description: "Unique user identifier",
    pattern: "^usr_[a-zA-Z0-9]+$"
  }
})
```

## Summary

| Function | Description |
|----------|-------------|
| `JSONSchema.make(schema)` | Generate JSON Schema |
| `annotations({ jsonSchema: {...} })` | Override generated schema |
| `annotations({ identifier: "..." })` | Create reusable $ref |
| `annotations({ title, description })` | Add documentation |
| `annotations({ examples: [...] })` | Add examples |

## Next Steps

- [Classes](/guide/classes) - Schema-backed TypeScript classes
- [Transformations](/guide/transformations) - Type conversions
- [Best Practices](/best-practices/) - Schema design patterns

