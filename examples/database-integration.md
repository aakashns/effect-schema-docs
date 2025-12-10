---
title: Database Integration
description: Transform between database and application types with Effect Schema
---

# Database Integration

This example shows how to use Effect Schema to transform data between database representations and application types, with examples for Prisma and raw SQL queries.

## The Problem

Database data often differs from application types:
- Nullable columns vs Option types
- String dates vs Date objects
- JSON columns vs typed objects
- Database IDs vs branded types

Effect Schema bridges this gap with bidirectional transformations.

## Basic Prisma Integration

Transform Prisma models to application types:

```typescript
import { Schema, Option } from "effect"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Schema matching Prisma's output (nullable name)
const UserFromDB = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.NullOr(Schema.String),  // Prisma returns null
  createdAt: Schema.DateFromSelf,      // Prisma returns Date objects
  updatedAt: Schema.DateFromSelf
})

// Application type (Option instead of null)
const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.OptionFromNullOr(Schema.String),  // Option<string>
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf
})

type User = typeof User.Type
// {
//   id: string
//   email: string
//   name: Option<string>
//   createdAt: Date
//   updatedAt: Date
// }
```

## Transform Between Representations

Create a transformation schema:

```typescript
const dbToApp = Schema.transform(
  UserFromDB,
  User,
  {
    decode: (db) => ({
      ...db,
      name: Option.fromNullable(db.name)
    }),
    encode: (app) => ({
      ...app,
      name: Option.getOrNull(app.name)
    })
  }
)

// Usage
async function getUser(id: string): Promise<User | null> {
  const dbUser = await prisma.user.findUnique({ where: { id } })
  
  if (!dbUser) return null
  
  // Transform from DB to app representation
  return Schema.decodeSync(dbToApp)(dbUser)
}

async function updateUser(
  id: string, 
  data: { name?: Option.Option<string>; email?: string }
): Promise<User> {
  // Transform from app to DB representation for the update
  const updateData: any = {}
  
  if (data.email !== undefined) {
    updateData.email = data.email
  }
  
  if (data.name !== undefined) {
    updateData.name = Option.getOrNull(data.name)
  }
  
  const updated = await prisma.user.update({
    where: { id },
    data: updateData
  })
  
  return Schema.decodeSync(dbToApp)(updated)
}
```

## JSON Columns

Handle JSON columns with proper typing:

```typescript
// The settings stored as JSON in the database
const UserSettings = Schema.Struct({
  theme: Schema.Literal("light", "dark"),
  notifications: Schema.Boolean,
  language: Schema.String
})

const UserWithSettingsFromDB = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  // Prisma returns JSON columns as unknown
  settings: Schema.Unknown
})

const UserWithSettings = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  settings: UserSettings  // Properly typed
})

// Transform with JSON parsing
const userWithSettingsTransform = Schema.transform(
  UserWithSettingsFromDB,
  UserWithSettings,
  {
    decode: (db) => ({
      ...db,
      // Parse the JSON into our typed structure
      settings: Schema.decodeUnknownSync(UserSettings)(db.settings)
    }),
    encode: (app) => ({
      ...app,
      settings: app.settings as unknown
    })
  }
)
```

## Branded IDs with Database

Use branded types for type-safe ID handling:

```typescript
const UserId = Schema.String.pipe(Schema.brand("UserId"))
const PostId = Schema.String.pipe(Schema.brand("PostId"))

type UserId = typeof UserId.Type
type PostId = typeof PostId.Type

// Application schema with branded IDs
const Post = Schema.Struct({
  id: PostId,
  authorId: UserId,
  title: Schema.String,
  content: Schema.String,
  published: Schema.Boolean
})

type Post = typeof Post.Type

// Repository pattern
class PostRepository {
  async findById(id: PostId): Promise<Post | null> {
    const dbPost = await prisma.post.findUnique({ 
      where: { id } // id is string at runtime, but branded at compile time
    })
    
    if (!dbPost) return null
    
    return Schema.decodeUnknownSync(Post)(dbPost)
  }
  
  async findByAuthor(authorId: UserId): Promise<Post[]> {
    const dbPosts = await prisma.post.findMany({
      where: { authorId }
    })
    
    return dbPosts.map(p => Schema.decodeUnknownSync(Post)(p))
  }
  
  async create(data: {
    authorId: UserId
    title: string
    content: string
  }): Promise<Post> {
    const dbPost = await prisma.post.create({
      data: {
        ...data,
        published: false
      }
    })
    
    return Schema.decodeUnknownSync(Post)(dbPost)
  }
}
```

## Raw SQL Queries

Validate results from raw SQL queries:

```typescript
import { Schema } from "effect"

// Expected shape of our query result
const UserStatsRow = Schema.Struct({
  user_id: Schema.String,
  email: Schema.String,
  post_count: Schema.BigIntFromSelf,  // SQL COUNT returns BigInt
  latest_post_date: Schema.NullOr(Schema.DateFromSelf)
})

// Transform to application type
const UserStats = Schema.Struct({
  userId: Schema.String,
  email: Schema.String,
  postCount: Schema.Number,
  latestPostDate: Schema.OptionFromNullOr(Schema.DateFromSelf)
})

const rowToStats = Schema.transform(
  UserStatsRow,
  UserStats,
  {
    decode: (row) => ({
      userId: row.user_id,
      email: row.email,
      postCount: Number(row.post_count),
      latestPostDate: Option.fromNullable(row.latest_post_date)
    }),
    encode: (stats) => ({
      user_id: stats.userId,
      email: stats.email,
      post_count: BigInt(stats.postCount),
      latest_post_date: Option.getOrNull(stats.latestPostDate)
    })
  }
)

async function getUserStats(): Promise<UserStats[]> {
  const results = await prisma.$queryRaw`
    SELECT 
      u.id as user_id,
      u.email,
      COUNT(p.id) as post_count,
      MAX(p.created_at) as latest_post_date
    FROM users u
    LEFT JOIN posts p ON p.author_id = u.id
    GROUP BY u.id, u.email
  `
  
  // Validate and transform each row
  return Schema.decodeUnknownSync(Schema.Array(rowToStats))(results)
}
```

## Aggregations and Computed Fields

Handle computed fields and aggregations:

```typescript
const OrderSummaryRow = Schema.Struct({
  order_id: Schema.String,
  customer_name: Schema.String,
  total_items: Schema.BigIntFromSelf,
  total_amount: Schema.String,  // DECIMAL comes as string
  status: Schema.String
})

const OrderSummary = Schema.Struct({
  orderId: Schema.String.pipe(Schema.brand("OrderId")),
  customerName: Schema.String,
  totalItems: Schema.Number,
  totalAmount: Schema.Number,
  status: Schema.Literal("pending", "paid", "shipped", "delivered")
})

const summaryTransform = Schema.transform(
  OrderSummaryRow,
  OrderSummary,
  {
    decode: (row) => ({
      orderId: row.order_id as any, // Brand at decode time
      customerName: row.customer_name,
      totalItems: Number(row.total_items),
      totalAmount: parseFloat(row.total_amount),
      status: row.status as any  // Assuming valid from DB
    }),
    encode: (summary) => ({
      order_id: summary.orderId,
      customer_name: summary.customerName,
      total_items: BigInt(summary.totalItems),
      total_amount: summary.totalAmount.toFixed(2),
      status: summary.status
    })
  }
)
```

## Error Handling

Handle database validation errors gracefully:

```typescript
import { Schema, Either } from "effect"

async function safeGetUser(id: string): Promise<Either.Either<User, Error>> {
  try {
    const dbUser = await prisma.user.findUnique({ where: { id } })
    
    if (!dbUser) {
      return Either.left(new Error("User not found"))
    }
    
    const result = Schema.decodeUnknownEither(dbToApp)(dbUser)
    
    if (Either.isLeft(result)) {
      // Database returned invalid data - log for investigation
      console.error("Invalid user data from DB:", result.left)
      return Either.left(new Error("Invalid user data"))
    }
    
    return Either.right(result.right)
    
  } catch (error) {
    return Either.left(error as Error)
  }
}
```

## Key Takeaways

1. **Transform at boundaries** - Convert between DB and app types at repository layer
2. **Use Option for nullables** - Better than null checks throughout your code
3. **Brand your IDs** - Prevent mixing up user IDs with post IDs
4. **Validate raw queries** - Don't trust raw SQL results without validation
5. **Handle JSON columns** - Parse and validate JSON data from the database

## Next Steps

- [Transformations](/guide/transformations) - Deep dive into transformations
- [Brands](/guide/brands) - More on branded types
- [API Validation](/examples/api-validation) - Validate API requests
