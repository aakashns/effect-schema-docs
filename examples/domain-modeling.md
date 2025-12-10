---
title: Domain Modeling
description: Model complex business domains with Effect Schema
---

# Domain Modeling

This example demonstrates how to use Effect Schema for rich domain modeling, including branded types, state machines, and making invalid states unrepresentable.

## The Problem

Good domain modeling requires:
- Distinguishing between different ID types (user ID vs order ID)
- Enforcing business rules at the type level
- Modeling state machines where transitions are type-safe
- Preventing invalid states from being representable

Effect Schema makes this possible with branded types and discriminated unions.

## Branded Value Objects

Use brands to create distinct types that can't be accidentally mixed:

```typescript
import { Schema } from "effect"

// These are all strings at runtime, but distinct types at compile time
const ProductId = Schema.String.pipe(Schema.brand("ProductId"))
const OrderId = Schema.String.pipe(Schema.brand("OrderId"))
const CustomerId = Schema.String.pipe(Schema.brand("CustomerId"))

type ProductId = typeof ProductId.Type   // string & Brand<"ProductId">
type OrderId = typeof OrderId.Type       // string & Brand<"OrderId">
type CustomerId = typeof CustomerId.Type // string & Brand<"CustomerId">

// Now TypeScript prevents mixing them up
function getOrder(id: OrderId) { /* ... */ }
function getProduct(id: ProductId) { /* ... */ }

const orderId = Schema.decodeSync(OrderId)("ord_123")
const productId = Schema.decodeSync(ProductId)("prod_456")

getOrder(orderId)     // ✓ Works
getOrder(productId)   // ✗ Type error! ProductId is not assignable to OrderId
```

## Value Objects with Validation

Create value objects that enforce business rules:

```typescript
// Money must be non-negative and finite
const Money = Schema.Number.pipe(
  Schema.finite(),
  Schema.nonNegative(),
  Schema.brand("Money")
)

// Email with format validation
const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("Email")
)

// US ZIP code
const ZipCode = Schema.String.pipe(
  Schema.pattern(/^\d{5}(-\d{4})?$/),
  Schema.brand("ZipCode")
)

// Positive integer quantity
const Quantity = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("Quantity")
)
```

## Entity Definitions

Build entities from value objects:

```typescript
const Product = Schema.Struct({
  id: ProductId,
  name: Schema.String.pipe(Schema.minLength(1)),
  description: Schema.String,
  price: Money,
  inStock: Schema.Boolean
})

const OrderItem = Schema.Struct({
  productId: ProductId,
  quantity: Quantity,
  unitPrice: Money
})

const Address = Schema.Struct({
  street: Schema.String.pipe(Schema.nonEmptyString()),
  city: Schema.String.pipe(Schema.nonEmptyString()),
  state: Schema.String.pipe(Schema.length(2)),
  zipCode: ZipCode,
  country: Schema.String.pipe(Schema.length(2))
})
```

## State Machine with Discriminated Unions

Model order states where each state has exactly the data it needs:

```typescript
// Pending: just created, awaiting payment
const PendingOrder = Schema.Struct({
  _tag: Schema.Literal("Pending"),
  id: OrderId,
  customerId: CustomerId,
  items: Schema.NonEmptyArray(OrderItem),
  shippingAddress: Address,
  createdAt: Schema.DateFromString
})

// Paid: payment received, ready to ship
const PaidOrder = Schema.Struct({
  _tag: Schema.Literal("Paid"),
  id: OrderId,
  customerId: CustomerId,
  items: Schema.NonEmptyArray(OrderItem),
  shippingAddress: Address,
  createdAt: Schema.DateFromString,
  // New fields only available after payment
  paidAt: Schema.DateFromString,
  paymentId: Schema.String
})

// Shipped: on its way to customer
const ShippedOrder = Schema.Struct({
  _tag: Schema.Literal("Shipped"),
  id: OrderId,
  customerId: CustomerId,
  items: Schema.NonEmptyArray(OrderItem),
  shippingAddress: Address,
  createdAt: Schema.DateFromString,
  paidAt: Schema.DateFromString,
  paymentId: Schema.String,
  // New fields only available after shipping
  shippedAt: Schema.DateFromString,
  trackingNumber: Schema.String
})

// Delivered: completed
const DeliveredOrder = Schema.Struct({
  _tag: Schema.Literal("Delivered"),
  id: OrderId,
  customerId: CustomerId,
  items: Schema.NonEmptyArray(OrderItem),
  shippingAddress: Address,
  createdAt: Schema.DateFromString,
  paidAt: Schema.DateFromString,
  paymentId: Schema.String,
  shippedAt: Schema.DateFromString,
  trackingNumber: Schema.String,
  // New field only available after delivery
  deliveredAt: Schema.DateFromString
})

// Cancelled: order was cancelled
const CancelledOrder = Schema.Struct({
  _tag: Schema.Literal("Cancelled"),
  id: OrderId,
  customerId: CustomerId,
  items: Schema.NonEmptyArray(OrderItem),
  shippingAddress: Address,
  createdAt: Schema.DateFromString,
  cancelledAt: Schema.DateFromString,
  cancellationReason: Schema.String
})

// Union of all states
const Order = Schema.Union(
  PendingOrder,
  PaidOrder,
  ShippedOrder,
  DeliveredOrder,
  CancelledOrder
)

type Order = typeof Order.Type
```

## Type-Safe State Transitions

The type system enforces valid state transitions:

```typescript
type PendingOrder = typeof PendingOrder.Type
type PaidOrder = typeof PaidOrder.Type
type ShippedOrder = typeof ShippedOrder.Type

// Only pending orders can be paid
function payOrder(
  order: PendingOrder, 
  paymentId: string
): PaidOrder {
  return {
    ...order,
    _tag: "Paid",
    paidAt: new Date(),
    paymentId
  }
}

// Only paid orders can be shipped
function shipOrder(
  order: PaidOrder, 
  trackingNumber: string
): ShippedOrder {
  return {
    ...order,
    _tag: "Shipped",
    shippedAt: new Date(),
    trackingNumber
  }
}

// Type guards for narrowing
function isPending(order: Order): order is PendingOrder {
  return order._tag === "Pending"
}

function isPaid(order: Order): order is PaidOrder {
  return order._tag === "Paid"
}

// Usage
function processOrder(order: Order) {
  switch (order._tag) {
    case "Pending":
      // order is PendingOrder here
      console.log("Awaiting payment")
      break
    case "Paid":
      // order is PaidOrder here
      console.log(`Payment received: ${order.paymentId}`)
      break
    case "Shipped":
      // order is ShippedOrder here
      console.log(`Tracking: ${order.trackingNumber}`)
      break
    case "Delivered":
      console.log(`Delivered at: ${order.deliveredAt}`)
      break
    case "Cancelled":
      console.log(`Cancelled: ${order.cancellationReason}`)
      break
  }
}
```

## Business Logic with Exhaustive Matching

Calculate totals with type-safe pattern matching:

```typescript
function calculateTotal(order: Order): number {
  return order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )
}

function getOrderStatus(order: Order): string {
  switch (order._tag) {
    case "Pending":
      return "Awaiting payment"
    case "Paid":
      return "Processing"
    case "Shipped":
      return `Shipped - tracking: ${order.trackingNumber}`
    case "Delivered":
      return "Delivered"
    case "Cancelled":
      return `Cancelled: ${order.cancellationReason}`
    // TypeScript ensures all cases are handled
  }
}

// Check if an order can be cancelled
function canCancel(order: Order): boolean {
  return order._tag === "Pending" || order._tag === "Paid"
}
```

## Using TaggedStruct for Cleaner Syntax

`Schema.TaggedStruct` simplifies discriminated union creation:

```typescript
const CreateOrderCommand = Schema.TaggedStruct("CreateOrder", {
  customerId: CustomerId,
  items: Schema.NonEmptyArray(OrderItem),
  shippingAddress: Address
})

const CancelOrderCommand = Schema.TaggedStruct("CancelOrder", {
  orderId: OrderId,
  reason: Schema.String
})

const UpdateShippingCommand = Schema.TaggedStruct("UpdateShipping", {
  orderId: OrderId,
  newAddress: Address
})

const OrderCommand = Schema.Union(
  CreateOrderCommand,
  CancelOrderCommand,
  UpdateShippingCommand
)

type OrderCommand = typeof OrderCommand.Type

// Handle commands with pattern matching
function handleCommand(command: OrderCommand) {
  switch (command._tag) {
    case "CreateOrder":
      return createOrder(command.customerId, command.items, command.shippingAddress)
    case "CancelOrder":
      return cancelOrder(command.orderId, command.reason)
    case "UpdateShipping":
      return updateShipping(command.orderId, command.newAddress)
  }
}
```

## Key Takeaways

1. **Branded types** prevent mixing up IDs and other string/number values
2. **Discriminated unions** model state machines with type safety
3. **Invalid states are unrepresentable** - a shipped order always has a tracking number
4. **Exhaustive matching** ensures all cases are handled
5. **Type guards** enable safe narrowing from union types

## Next Steps

- [Brands](/guide/brands) - Deep dive into branded types
- [Unions](/guide/unions) - More on discriminated unions
- [Classes](/guide/classes) - Schema with class instances
