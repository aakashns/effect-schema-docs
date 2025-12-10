---
title: Examples
description: Practical examples of Effect Schema in real-world scenarios
---

# Examples

Real-world examples of using Effect Schema.

## API Validation

### REST API Request/Response

```typescript
import { Schema } from "effect"

// Request schemas
const CreateUserRequest = Schema.Struct({
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  ),
  password: Schema.String.pipe(Schema.minLength(8)),
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  role: Schema.optional(Schema.Literal("admin", "user"), { 
    default: () => "user" as const 
  })
})

const UpdateUserRequest = Schema.partial(
  Schema.Struct({
    email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
    name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100))
  }),
  { exact: true }
)

// Response schemas
const UserResponse = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.String,
  role: Schema.Literal("admin", "user"),
  createdAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString
})

const PaginatedResponse = <T extends Schema.Schema.Any>(item: T) =>
  Schema.Struct({
    data: Schema.Array(item),
    pagination: Schema.Struct({
      page: Schema.Number,
      pageSize: Schema.Number,
      total: Schema.Number,
      totalPages: Schema.Number
    })
  })

const UsersListResponse = PaginatedResponse(UserResponse)

// Usage in API handler
async function createUser(req: Request) {
  const body = await req.json()
  const input = Schema.decodeUnknownSync(CreateUserRequest)(body)
  
  // Create user in database...
  const user = { 
    id: "123", 
    ...input, 
    createdAt: new Date(), 
    updatedAt: new Date() 
  }
  
  return new Response(
    JSON.stringify(Schema.encodeSync(UserResponse)(user)),
    { headers: { "Content-Type": "application/json" } }
  )
}
```

## Form Validation

### React Hook Form Integration

```typescript
import { Schema } from "effect"
import { useForm } from "react-hook-form"

const LoginForm = Schema.Struct({
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: () => "Please enter a valid email"
    })
  ),
  password: Schema.String.pipe(
    Schema.minLength(8, {
      message: () => "Password must be at least 8 characters"
    })
  ),
  rememberMe: Schema.optional(Schema.Boolean, { default: () => false })
})

type LoginFormData = typeof LoginForm.Type

function LoginPage() {
  const { register, handleSubmit, setError } = useForm<LoginFormData>()

  const onSubmit = handleSubmit(async (data) => {
    const result = Schema.decodeUnknownEither(LoginForm)(data)
    
    if (Either.isLeft(result)) {
      const errors = ParseResult.ArrayFormatter.formatIssueSync(result.left.issue)
      errors.forEach(err => {
        setError(err.path.join(".") as any, { message: err.message })
      })
      return
    }
    
    // Submit validated data
    await login(result.right)
  })

  return (
    <form onSubmit={onSubmit}>
      <input {...register("email")} placeholder="Email" />
      <input {...register("password")} type="password" />
      <label>
        <input {...register("rememberMe")} type="checkbox" />
        Remember me
      </label>
      <button type="submit">Login</button>
    </form>
  )
}
```

## Configuration Parsing

### Environment Variables

```typescript
import { Schema } from "effect"

const DatabaseConfig = Schema.Struct({
  host: Schema.String.pipe(Schema.nonEmptyString()),
  port: Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 65535)),
  database: Schema.String.pipe(Schema.nonEmptyString()),
  username: Schema.String.pipe(Schema.nonEmptyString()),
  password: Schema.String,
  ssl: Schema.optional(Schema.BooleanFromString, { default: () => false }),
  poolSize: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.positive()), {
    default: () => 10
  })
})

const AppConfig = Schema.Struct({
  nodeEnv: Schema.Literal("development", "staging", "production"),
  port: Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 65535)),
  logLevel: Schema.optional(
    Schema.Literal("debug", "info", "warn", "error"),
    { default: () => "info" as const }
  ),
  database: DatabaseConfig
})

type AppConfig = typeof AppConfig.Type

function loadConfig(): AppConfig {
  return Schema.decodeUnknownSync(AppConfig)({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL,
      poolSize: process.env.DB_POOL_SIZE
    }
  })
}

const config = loadConfig()
// config.port is a number
// config.database.poolSize is a number
// config.database.ssl is a boolean
```

## Domain Modeling

### E-commerce Order System

```typescript
import { Schema } from "effect"

// Value objects with brands
const ProductId = Schema.String.pipe(Schema.brand("ProductId"))
const OrderId = Schema.String.pipe(Schema.brand("OrderId"))
const CustomerId = Schema.String.pipe(Schema.brand("CustomerId"))
const Money = Schema.Number.pipe(Schema.finite(), Schema.nonNegative())

// Product
const Product = Schema.Struct({
  id: ProductId,
  name: Schema.String.pipe(Schema.minLength(1)),
  price: Money,
  inStock: Schema.Boolean
})

// Order line item
const OrderItem = Schema.Struct({
  productId: ProductId,
  quantity: Schema.Number.pipe(Schema.int(), Schema.positive()),
  unitPrice: Money
})

// Address
const Address = Schema.Struct({
  street: Schema.String.pipe(Schema.nonEmptyString()),
  city: Schema.String.pipe(Schema.nonEmptyString()),
  state: Schema.String.pipe(Schema.length(2)),
  zipCode: Schema.String.pipe(Schema.pattern(/^\d{5}(-\d{4})?$/)),
  country: Schema.String.pipe(Schema.length(2))
})

// Order states (make invalid states impossible)
const PendingOrder = Schema.Struct({
  status: Schema.Literal("pending"),
  id: OrderId,
  customerId: CustomerId,
  items: Schema.NonEmptyArray(OrderItem),
  shippingAddress: Address,
  createdAt: Schema.DateFromString
})

const PaidOrder = Schema.Struct({
  status: Schema.Literal("paid"),
  id: OrderId,
  customerId: CustomerId,
  items: Schema.NonEmptyArray(OrderItem),
  shippingAddress: Address,
  createdAt: Schema.DateFromString,
  paidAt: Schema.DateFromString,
  paymentId: Schema.String
})

const ShippedOrder = Schema.Struct({
  status: Schema.Literal("shipped"),
  id: OrderId,
  customerId: CustomerId,
  items: Schema.NonEmptyArray(OrderItem),
  shippingAddress: Address,
  createdAt: Schema.DateFromString,
  paidAt: Schema.DateFromString,
  paymentId: Schema.String,
  shippedAt: Schema.DateFromString,
  trackingNumber: Schema.String
})

const DeliveredOrder = Schema.Struct({
  status: Schema.Literal("delivered"),
  id: OrderId,
  customerId: CustomerId,
  items: Schema.NonEmptyArray(OrderItem),
  shippingAddress: Address,
  createdAt: Schema.DateFromString,
  paidAt: Schema.DateFromString,
  paymentId: Schema.String,
  shippedAt: Schema.DateFromString,
  trackingNumber: Schema.String,
  deliveredAt: Schema.DateFromString
})

const Order = Schema.Union(
  PendingOrder,
  PaidOrder,
  ShippedOrder,
  DeliveredOrder
)

type Order = typeof Order.Type

// Type-safe order operations
function calculateTotal(order: Order): number {
  return order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )
}

function canShip(order: Order): order is typeof PaidOrder.Type {
  return order.status === "paid"
}
```

## Database Integration

### Prisma Integration

```typescript
import { Schema } from "effect"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Schema matching Prisma model
const UserFromDB = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.NullOr(Schema.String),
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf
})

// Application type (transform nulls to Option)
const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.OptionFromNullOr(Schema.String),
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf
})

type User = typeof User.Type

// Transform from DB to app type
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

async function getUser(id: string): Promise<User | null> {
  const dbUser = await prisma.user.findUnique({ where: { id } })
  if (!dbUser) return null
  return Schema.decodeSync(dbToApp)(dbUser)
}

async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const updateData = Schema.encodeSync(
    Schema.partial(Schema.pick(User, "name", "email"))
  )(data)
  
  const updated = await prisma.user.update({
    where: { id },
    data: updateData
  })
  
  return Schema.decodeSync(dbToApp)(updated)
}
```

## WebSocket Messages

### Type-Safe Message Protocol

```typescript
import { Schema } from "effect"

// Client → Server messages
const JoinRoom = Schema.TaggedStruct("JoinRoom", {
  roomId: Schema.String
})

const LeaveRoom = Schema.TaggedStruct("LeaveRoom", {
  roomId: Schema.String
})

const SendMessage = Schema.TaggedStruct("SendMessage", {
  roomId: Schema.String,
  content: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(1000))
})

const ClientMessage = Schema.Union(JoinRoom, LeaveRoom, SendMessage)
type ClientMessage = typeof ClientMessage.Type

// Server → Client messages
const UserJoined = Schema.TaggedStruct("UserJoined", {
  roomId: Schema.String,
  userId: Schema.String,
  username: Schema.String
})

const UserLeft = Schema.TaggedStruct("UserLeft", {
  roomId: Schema.String,
  userId: Schema.String
})

const NewMessage = Schema.TaggedStruct("NewMessage", {
  roomId: Schema.String,
  messageId: Schema.String,
  userId: Schema.String,
  content: Schema.String,
  timestamp: Schema.DateFromString
})

const ErrorMessage = Schema.TaggedStruct("Error", {
  code: Schema.String,
  message: Schema.String
})

const ServerMessage = Schema.Union(UserJoined, UserLeft, NewMessage, ErrorMessage)
type ServerMessage = typeof ServerMessage.Type

// Usage
function handleWebSocket(ws: WebSocket) {
  ws.onmessage = (event) => {
    const result = Schema.decodeUnknownEither(
      Schema.parseJson(ClientMessage)
    )(event.data)
    
    if (Either.isLeft(result)) {
      ws.send(JSON.stringify(
        Schema.encodeSync(ServerMessage)({
          _tag: "Error",
          code: "INVALID_MESSAGE",
          message: "Invalid message format"
        })
      ))
      return
    }
    
    const message = result.right
    switch (message._tag) {
      case "JoinRoom":
        handleJoinRoom(ws, message.roomId)
        break
      case "LeaveRoom":
        handleLeaveRoom(ws, message.roomId)
        break
      case "SendMessage":
        handleSendMessage(ws, message.roomId, message.content)
        break
    }
  }
}
```

## More Examples

Looking for more examples? Check out:

- [Effect Examples](https://github.com/Effect-TS/effect/tree/main/packages/effect/examples)
- [Discord Community](https://discord.gg/effect-ts) - Ask for examples

