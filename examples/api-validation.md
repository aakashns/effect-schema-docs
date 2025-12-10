---
title: API Validation
description: Build type-safe REST APIs with Effect Schema
---

# API Validation

This example demonstrates how to use Effect Schema to build type-safe REST APIs with proper request validation, response encoding, and pagination.

## The Problem

When building APIs, you need to:
- Validate incoming request data
- Transform data between wire format and application types
- Ensure responses match your API contract
- Handle pagination consistently

Effect Schema solves all of these with a single schema definition.

## Request Schemas

Define schemas for your API endpoints that validate and transform incoming data:

```typescript
import { Schema } from "effect"

// Create user request with validation
const CreateUserRequest = Schema.Struct({
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => "Invalid email format"
    })
  ),
  password: Schema.String.pipe(
    Schema.minLength(8, {
      message: () => "Password must be at least 8 characters"
    })
  ),
  name: Schema.String.pipe(
    Schema.minLength(1),
    Schema.maxLength(100)
  ),
  role: Schema.optional(
    Schema.Literal("admin", "user"), 
    { default: () => "user" as const }
  )
})

type CreateUserRequest = typeof CreateUserRequest.Type
```

### Partial Updates with `Schema.partial`

For PATCH endpoints, create partial versions of your schemas:

```typescript
const UpdateUserRequest = Schema.partial(
  Schema.Struct({
    email: Schema.String.pipe(
      Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    ),
    name: Schema.String.pipe(
      Schema.minLength(1), 
      Schema.maxLength(100)
    )
  }),
  { exact: true }
)

type UpdateUserRequest = typeof UpdateUserRequest.Type
// { email?: string; name?: string }
```

## Response Schemas

Define schemas for your API responses to ensure consistency:

```typescript
const UserResponse = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.String,
  role: Schema.Literal("admin", "user"),
  createdAt: Schema.DateFromString,  // Date in app, string in JSON
  updatedAt: Schema.DateFromString
})

type UserResponse = typeof UserResponse.Type
```

Notice `DateFromString` - internally you work with `Date` objects, but the schema automatically serializes to ISO strings in responses.

## Generic Pagination

Create reusable pagination wrappers:

```typescript
const PaginatedResponse = <T extends Schema.Schema.Any>(itemSchema: T) =>
  Schema.Struct({
    data: Schema.Array(itemSchema),
    pagination: Schema.Struct({
      page: Schema.Number,
      pageSize: Schema.Number,
      total: Schema.Number,
      totalPages: Schema.Number
    })
  })

// Usage
const UsersListResponse = PaginatedResponse(UserResponse)
type UsersListResponse = typeof UsersListResponse.Type
```

## Complete API Handler Example

Here's how everything comes together in an API handler:

```typescript
import { Schema } from "effect"

// Decode request body
async function createUser(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    
    // Validate and decode request
    const input = Schema.decodeUnknownSync(CreateUserRequest)(body)
    
    // input is fully typed: CreateUserRequest
    // - input.email is validated string
    // - input.role defaults to "user" if not provided
    
    // Create user in database (your business logic)
    const user = {
      id: crypto.randomUUID(),
      email: input.email,
      name: input.name,
      role: input.role,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Encode response (Date → string automatically)
    const responseBody = Schema.encodeSync(UserResponse)(user)
    
    return new Response(JSON.stringify(responseBody), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    })
    
  } catch (error) {
    // Schema validation errors have structured information
    if (error instanceof Schema.ParseError) {
      return new Response(JSON.stringify({
        error: "Validation failed",
        details: error.message
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }
    throw error
  }
}
```

## Error Response Schema

Define consistent error responses:

```typescript
const ErrorResponse = Schema.Struct({
  error: Schema.String,
  code: Schema.String,
  details: Schema.optional(Schema.Unknown)
})

const ValidationErrorResponse = Schema.Struct({
  error: Schema.Literal("Validation failed"),
  code: Schema.Literal("VALIDATION_ERROR"),
  fields: Schema.Array(Schema.Struct({
    path: Schema.String,
    message: Schema.String
  }))
})
```

## Query Parameters

Parse and validate query parameters:

```typescript
const ListUsersQuery = Schema.Struct({
  page: Schema.optional(
    Schema.NumberFromString.pipe(Schema.int(), Schema.positive()),
    { default: () => 1 }
  ),
  pageSize: Schema.optional(
    Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 100)),
    { default: () => 20 }
  ),
  role: Schema.optional(Schema.Literal("admin", "user")),
  search: Schema.optional(Schema.String)
})

function parseQueryParams(url: URL) {
  const params = Object.fromEntries(url.searchParams)
  return Schema.decodeUnknownSync(ListUsersQuery)(params)
}

// Usage
const query = parseQueryParams(new URL(req.url))
// query.page is number (defaults to 1)
// query.pageSize is number (defaults to 20, max 100)
// query.role is "admin" | "user" | undefined
```

## Key Takeaways

1. **Single source of truth** - Schema defines both validation and types
2. **Bidirectional** - Same schema handles request decoding and response encoding
3. **Composable** - Build complex schemas from simple building blocks
4. **Type-safe** - Full TypeScript inference throughout

## Next Steps

- [Form Validation](/examples/form-validation) - Client-side validation
- [Filters](/guide/filters) - Built-in validation filters
- [Transformations](/guide/transformations) - Advanced data transformations
