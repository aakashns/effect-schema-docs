---
title: Classes
description: Learn how to create schema-backed TypeScript classes in Effect Schema
---

# Classes

Effect Schema lets you define TypeScript classes that are automatically validated. This combines the convenience of classes with the safety of schema validation.

## Why Schema Classes?

Traditional classes have no runtime validation:

```typescript
// ❌ No validation - any values accepted
class User {
  constructor(public name: string, public age: number) {}
}

const user = new User("", -5)  // Invalid but allowed!
```

Schema classes validate on construction:

```typescript
import { Schema } from "effect"

class User extends Schema.Class<User>("User")({
  name: Schema.String.pipe(Schema.nonEmptyString()),
  age: Schema.Number.pipe(Schema.int(), Schema.between(0, 150))
}) {}

const user = new User({ name: "Alice", age: 30 })  // ✅ Validated
const bad = new User({ name: "", age: -5 })        // ❌ Throws!
```

## Defining Schema Classes

### Basic Class

```typescript
import { Schema } from "effect"

class Person extends Schema.Class<Person>("Person")({
  name: Schema.String,
  age: Schema.Number
}) {}

// Use like a regular class
const person = new Person({ name: "Alice", age: 30 })
console.log(person.name)  // "Alice"
console.log(person.age)   // 30

// It's also a schema!
Schema.decodeUnknownSync(Person)({ name: "Bob", age: 25 })
```

The generic parameter `Schema.Class<Person>` enables proper TypeScript inference for the `Self` type.

### With Validation

```typescript
import { Schema } from "effect"

class Email extends Schema.Class<Email>("Email")({
  value: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  )
}) {
  get domain(): string {
    return this.value.split("@")[1]
  }
}

const email = new Email({ value: "alice@example.com" })
console.log(email.domain)  // "example.com"

new Email({ value: "invalid" })  // ❌ Throws ParseError
```

### With Methods

Add methods to your schema classes:

```typescript
import { Schema } from "effect"

class Rectangle extends Schema.Class<Rectangle>("Rectangle")({
  width: Schema.Number.pipe(Schema.positive()),
  height: Schema.Number.pipe(Schema.positive())
}) {
  get area(): number {
    return this.width * this.height
  }

  get perimeter(): number {
    return 2 * (this.width + this.height)
  }

  scale(factor: number): Rectangle {
    return new Rectangle({
      width: this.width * factor,
      height: this.height * factor
    })
  }
}

const rect = new Rectangle({ width: 10, height: 5 })
console.log(rect.area)       // 50
console.log(rect.perimeter)  // 30

const scaled = rect.scale(2)
console.log(scaled.area)     // 200
```

## Extending Classes

### Extend Schema Classes

```typescript
import { Schema } from "effect"

// Base class
class Entity extends Schema.Class<Entity>("Entity")({
  id: Schema.String,
  createdAt: Schema.DateFromString
}) {}

// Extended class
class User extends Entity.extend<User>("User")({
  name: Schema.String,
  email: Schema.String
}) {}

const user = new User({
  id: "1",
  createdAt: "2024-01-15T10:30:00Z",
  name: "Alice",
  email: "alice@example.com"
})

// user.createdAt is a Date!
console.log(user.createdAt.getFullYear())  // 2024
```

### Inherit Methods

```typescript
import { Schema } from "effect"

class Entity extends Schema.Class<Entity>("Entity")({
  id: Schema.String,
  createdAt: Schema.DateFromString
}) {
  get age(): number {
    return Date.now() - this.createdAt.getTime()
  }
}

class User extends Entity.extend<User>("User")({
  name: Schema.String
}) {
  greet(): string {
    return `Hello, ${this.name}!`
  }
}

const user = new User({
  id: "1",
  createdAt: "2024-01-15T10:30:00Z",
  name: "Alice"
})

console.log(user.age)      // Inherited method
console.log(user.greet())  // "Hello, Alice!"
```

## Optional Fields

Use `Schema.optional` for optional class properties:

```typescript
import { Schema } from "effect"

class User extends Schema.Class<User>("User")({
  id: Schema.String,
  name: Schema.String,
  email: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String, { default: () => "N/A" })
}) {}

// email is optional
const user1 = new User({ id: "1", name: "Alice" })
console.log(user1.email)  // undefined
console.log(user1.phone)  // "N/A" (default applied)

// email provided
const user2 = new User({ 
  id: "2", 
  name: "Bob", 
  email: "bob@example.com" 
})
```

## Constructor Defaults

Provide default values for construction:

```typescript
import { Schema } from "effect"

class Settings extends Schema.Class<Settings>("Settings")({
  theme: Schema.optional(Schema.String).pipe(
    Schema.withConstructorDefault(() => "light")
  ),
  fontSize: Schema.optional(Schema.Number).pipe(
    Schema.withConstructorDefault(() => 14)
  )
}) {}

// Defaults applied during construction
const settings = new Settings({})
console.log(settings.theme)     // "light"
console.log(settings.fontSize)  // 14

// Can override defaults
const custom = new Settings({ theme: "dark" })
console.log(custom.theme)     // "dark"
console.log(custom.fontSize)  // 14
```

## make() Method

Schema classes provide a static `make` method:

```typescript
import { Schema } from "effect"

class User extends Schema.Class<User>("User")({
  name: Schema.String,
  age: Schema.Number
}) {}

// Both are equivalent
const user1 = new User({ name: "Alice", age: 30 })
const user2 = User.make({ name: "Alice", age: 30 })
```

## Using as Schema

Schema classes are schemas themselves:

```typescript
import { Schema } from "effect"

class User extends Schema.Class<User>("User")({
  name: Schema.String,
  age: Schema.Number
}) {}

// Use in other schemas
const Team = Schema.Struct({
  name: Schema.String,
  members: Schema.Array(User)
})

// Decode returns User instances
const team = Schema.decodeUnknownSync(Team)({
  name: "Engineering",
  members: [
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 }
  ]
})

// team.members[0] is a User instance
console.log(team.members[0] instanceof User)  // true
console.log(team.members[0].name)             // "Alice"
```

## Tagged Classes

Use `TaggedClass` for discriminated unions:

```typescript
import { Schema } from "effect"

class Circle extends Schema.TaggedClass<Circle>()("Circle", {
  radius: Schema.Number.pipe(Schema.positive())
}) {
  get area(): number {
    return Math.PI * this.radius ** 2
  }
}

class Rectangle extends Schema.TaggedClass<Rectangle>()("Rectangle", {
  width: Schema.Number.pipe(Schema.positive()),
  height: Schema.Number.pipe(Schema.positive())
}) {
  get area(): number {
    return this.width * this.height
  }
}

// Union of tagged classes
const Shape = Schema.Union(Circle, Rectangle)
type Shape = typeof Shape.Type

function getArea(shape: Shape): number {
  switch (shape._tag) {
    case "Circle":
      return shape.area  // shape is narrowed to Circle
    case "Rectangle":
      return shape.area  // shape is narrowed to Rectangle
  }
}

const circle = new Circle({ radius: 5 })
console.log(circle._tag)   // "Circle"
console.log(circle.area)   // ~78.54
```

## Error Classes

Create tagged error classes:

```typescript
import { Schema } from "effect"

class ValidationError extends Schema.TaggedError<ValidationError>()(
  "ValidationError",
  {
    field: Schema.String,
    message: Schema.String
  }
) {}

class NotFoundError extends Schema.TaggedError<NotFoundError>()(
  "NotFoundError",
  {
    resource: Schema.String,
    id: Schema.String
  }
) {
  get fullMessage(): string {
    return `${this.resource} with id ${this.id} not found`
  }
}

// These are proper Error instances
const error = new ValidationError({ 
  field: "email", 
  message: "Invalid format" 
})
console.log(error instanceof Error)  // true
console.log(error._tag)              // "ValidationError"
throw error  // Can be thrown
```

## Transformations in Classes

Classes can include transformed fields:

```typescript
import { Schema } from "effect"

class User extends Schema.Class<User>("User")({
  name: Schema.String,
  birthDate: Schema.DateFromString,  // string → Date
  role: Schema.Literal("admin", "user")
}) {
  get age(): number {
    const now = new Date()
    const diff = now.getTime() - this.birthDate.getTime()
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }
}

// Decode from JSON
const user = Schema.decodeUnknownSync(User)({
  name: "Alice",
  birthDate: "1990-05-15T00:00:00Z",
  role: "admin"
})

console.log(user.birthDate instanceof Date)  // true
console.log(user.age)  // Calculated from Date

// Encode back to JSON
const json = Schema.encodeSync(User)(user)
console.log(json.birthDate)  // "1990-05-15T00:00:00.000Z" (string)
```

## Practical Examples

### Entity Base Class

```typescript
import { Schema } from "effect"

class Entity extends Schema.Class<Entity>("Entity")({
  id: Schema.String.pipe(Schema.nonEmptyString()),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString
}) {}

class User extends Entity.extend<User>("User")({
  email: Schema.String,
  name: Schema.String,
  role: Schema.Literal("admin", "member", "guest")
}) {
  isAdmin(): boolean {
    return this.role === "admin"
  }
}

class Post extends Entity.extend<Post>("Post")({
  title: Schema.String,
  content: Schema.String,
  authorId: Schema.String,
  published: Schema.Boolean
}) {
  get excerpt(): string {
    return this.content.slice(0, 100) + "..."
  }
}
```

### Money with Currency

```typescript
import { Schema } from "effect"

class Money extends Schema.Class<Money>("Money")({
  amount: Schema.Number.pipe(Schema.finite()),
  currency: Schema.Literal("USD", "EUR", "GBP")
}) {
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("Cannot add different currencies")
    }
    return new Money({
      amount: this.amount + other.amount,
      currency: this.currency
    })
  }

  format(): string {
    const symbols = { USD: "$", EUR: "€", GBP: "£" }
    return `${symbols[this.currency]}${this.amount.toFixed(2)}`
  }
}

const price = new Money({ amount: 99.99, currency: "USD" })
console.log(price.format())  // "$99.99"
```

## Summary

| Pattern | Use Case |
|---------|----------|
| `Schema.Class<T>()` | Basic schema class |
| `.extend<T>()` | Extend existing schema class |
| `Schema.TaggedClass<T>()` | Discriminated union member |
| `Schema.TaggedError<T>()` | Error class |
| `make()` | Alternative constructor |

## Next Steps

- [Recursive Schemas](/guide/recursive-schemas) - Self-referential types
- [Extending Schemas](/guide/extending-schemas) - Composition patterns
- [Annotations](/guide/annotations) - Metadata and customization

