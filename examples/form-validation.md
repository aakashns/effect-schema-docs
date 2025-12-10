---
title: Form Validation
description: Integrate Effect Schema with React forms for type-safe validation
---

# Form Validation

This example shows how to integrate Effect Schema with React Hook Form for client-side validation with custom error messages and full TypeScript support.

## The Problem

Form validation typically requires:
- Defining validation rules
- Defining TypeScript types (often separately!)
- Custom error messages
- Integration with form libraries

Effect Schema handles all of this with a single definition.

## Basic Form Schema

Define a schema with custom error messages:

```typescript
import { Schema } from "effect"

const LoginForm = Schema.Struct({
  email: Schema.String.pipe(
    Schema.nonEmptyString({ 
      message: () => "Email is required" 
    }),
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => "Please enter a valid email address"
    })
  ),
  password: Schema.String.pipe(
    Schema.nonEmptyString({ 
      message: () => "Password is required" 
    }),
    Schema.minLength(8, {
      message: () => "Password must be at least 8 characters"
    })
  ),
  rememberMe: Schema.optional(Schema.Boolean, { 
    default: () => false 
  })
})

// TypeScript type is automatically inferred
type LoginFormData = typeof LoginForm.Type
// { email: string; password: string; rememberMe: boolean }
```

## React Hook Form Integration

Here's a complete React component with Schema validation:

```typescript
import { Schema, Either, ParseResult } from "effect"
import { useForm } from "react-hook-form"

function LoginPage() {
  const { 
    register, 
    handleSubmit, 
    setError, 
    formState: { errors } 
  } = useForm<LoginFormData>()

  const onSubmit = handleSubmit(async (data) => {
    // Validate with Schema
    const result = Schema.decodeUnknownEither(LoginForm)(data)
    
    if (Either.isLeft(result)) {
      // Convert Schema errors to React Hook Form errors
      const formatted = ParseResult.ArrayFormatter.formatIssueSync(
        result.left.issue
      )
      
      formatted.forEach(err => {
        const fieldPath = err.path.join(".") as keyof LoginFormData
        setError(fieldPath, { 
          type: "validation",
          message: err.message 
        })
      })
      return
    }
    
    // Data is validated and typed correctly
    const validData = result.right
    await submitLogin(validData)
  })

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input 
          id="email"
          type="email" 
          {...register("email")} 
        />
        {errors.email && (
          <span className="error">{errors.email.message}</span>
        )}
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input 
          id="password"
          type="password" 
          {...register("password")} 
        />
        {errors.password && (
          <span className="error">{errors.password.message}</span>
        )}
      </div>
      
      <div>
        <label>
          <input type="checkbox" {...register("rememberMe")} />
          Remember me
        </label>
      </div>
      
      <button type="submit">Log In</button>
    </form>
  )
}
```

## Registration Form with Password Confirmation

A more complex example with cross-field validation:

```typescript
import { Schema } from "effect"

const RegistrationForm = Schema.Struct({
  username: Schema.String.pipe(
    Schema.minLength(3, { 
      message: () => "Username must be at least 3 characters" 
    }),
    Schema.maxLength(20, { 
      message: () => "Username must be at most 20 characters" 
    }),
    Schema.pattern(/^[a-zA-Z0-9_]+$/, {
      message: () => "Username can only contain letters, numbers, and underscores"
    })
  ),
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => "Please enter a valid email"
    })
  ),
  password: Schema.String.pipe(
    Schema.minLength(8, { 
      message: () => "Password must be at least 8 characters" 
    }),
    Schema.pattern(/[A-Z]/, {
      message: () => "Password must contain at least one uppercase letter"
    }),
    Schema.pattern(/[0-9]/, {
      message: () => "Password must contain at least one number"
    })
  ),
  confirmPassword: Schema.String,
  acceptTerms: Schema.Boolean.pipe(
    Schema.filter((value) => value === true, {
      message: () => "You must accept the terms and conditions"
    })
  )
}).pipe(
  // Cross-field validation: passwords must match
  Schema.filter((form) => form.password === form.confirmPassword, {
    message: () => "Passwords do not match"
  })
)

type RegistrationFormData = typeof RegistrationForm.Type
```

## Creating a Reusable Resolver

Create a resolver function to integrate Schema with React Hook Form:

```typescript
import { Schema, Either, ParseResult } from "effect"
import type { Resolver } from "react-hook-form"

function schemaResolver<S extends Schema.Schema.Any>(
  schema: S
): Resolver<Schema.Schema.Type<S>> {
  return async (values) => {
    const result = Schema.decodeUnknownEither(schema)(values)
    
    if (Either.isRight(result)) {
      return { values: result.right, errors: {} }
    }
    
    const formatted = ParseResult.ArrayFormatter.formatIssueSync(
      result.left.issue
    )
    
    const errors: Record<string, { type: string; message: string }> = {}
    
    for (const error of formatted) {
      const path = error.path.join(".")
      if (!errors[path]) {
        errors[path] = {
          type: "validation",
          message: error.message
        }
      }
    }
    
    return { values: {}, errors }
  }
}

// Usage with useForm
function RegistrationPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: schemaResolver(RegistrationForm)
  })
  
  // Form automatically validates on submit
  const onSubmit = handleSubmit((data) => {
    // data is fully typed and validated
    console.log(data)
  })
  
  // ... rest of the form
}
```

## Dynamic Form Fields

Handle dynamic form fields with array schemas:

```typescript
const OrderForm = Schema.Struct({
  customerName: Schema.String.pipe(Schema.nonEmptyString()),
  items: Schema.NonEmptyArray(
    Schema.Struct({
      productId: Schema.String.pipe(Schema.nonEmptyString()),
      quantity: Schema.Number.pipe(
        Schema.int(),
        Schema.positive({ 
          message: () => "Quantity must be at least 1" 
        })
      )
    })
  ).pipe(
    Schema.maxItems(10, {
      message: () => "Maximum 10 items per order"
    })
  )
})
```

## Error Message Customization

Effect Schema provides flexible error message customization:

```typescript
const PasswordField = Schema.String.pipe(
  Schema.minLength(8, {
    message: (issue) => 
      `Password is too short (${issue.actual} chars, need 8+)`
  }),
  Schema.pattern(/[A-Z]/, {
    message: () => "Need at least one uppercase letter"
  }),
  Schema.pattern(/[a-z]/, {
    message: () => "Need at least one lowercase letter"
  }),
  Schema.pattern(/[0-9]/, {
    message: () => "Need at least one number"
  }),
  Schema.pattern(/[^a-zA-Z0-9]/, {
    message: () => "Need at least one special character"
  })
)
```

## Key Takeaways

1. **Single definition** - Schema defines both validation and TypeScript types
2. **Custom messages** - Full control over error messages with context
3. **Composable** - Build complex forms from simple field schemas
4. **Framework agnostic** - Works with any form library (React Hook Form, Formik, etc.)

## Next Steps

- [Error Messages](/guide/error-messages) - Advanced error customization
- [Filters](/guide/filters) - Built-in validation filters
- [API Validation](/examples/api-validation) - Server-side validation
