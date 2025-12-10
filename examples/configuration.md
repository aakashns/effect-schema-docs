---
title: Configuration Parsing
description: Parse environment variables and config files with Effect Schema
---

# Configuration Parsing

This example demonstrates how to use Effect Schema to parse and validate application configuration from environment variables, with automatic type coercion and sensible defaults.

## The Problem

Configuration parsing typically involves:
- Reading string values from environment variables
- Converting strings to appropriate types (numbers, booleans)
- Validating values are within acceptable ranges
- Providing default values
- Ensuring required values are present

Effect Schema handles all of this elegantly.

## Basic Environment Config

```typescript
import { Schema } from "effect"

const AppConfig = Schema.Struct({
  // Required enum value
  nodeEnv: Schema.Literal("development", "staging", "production"),
  
  // String to number conversion with validation
  port: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.between(1, 65535)
  ),
  
  // Optional with default
  logLevel: Schema.optional(
    Schema.Literal("debug", "info", "warn", "error"),
    { default: () => "info" as const }
  ),
  
  // Optional boolean from string
  debug: Schema.optional(
    Schema.BooleanFromString,
    { default: () => false }
  )
})

type AppConfig = typeof AppConfig.Type
// {
//   nodeEnv: "development" | "staging" | "production"
//   port: number
//   logLevel: "debug" | "info" | "warn" | "error"
//   debug: boolean
// }
```

## Database Configuration

A more complex nested configuration:

```typescript
const DatabaseConfig = Schema.Struct({
  host: Schema.String.pipe(
    Schema.nonEmptyString({ 
      message: () => "DB_HOST is required" 
    })
  ),
  port: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.between(1, 65535)
  ),
  database: Schema.String.pipe(
    Schema.nonEmptyString({ 
      message: () => "DB_NAME is required" 
    })
  ),
  username: Schema.String.pipe(
    Schema.nonEmptyString({ 
      message: () => "DB_USER is required" 
    })
  ),
  password: Schema.String,
  
  // Connection options with defaults
  ssl: Schema.optional(
    Schema.BooleanFromString,
    { default: () => false }
  ),
  poolSize: Schema.optional(
    Schema.NumberFromString.pipe(
      Schema.int(),
      Schema.between(1, 100)
    ),
    { default: () => 10 }
  ),
  connectionTimeout: Schema.optional(
    Schema.NumberFromString.pipe(Schema.int(), Schema.positive()),
    { default: () => 5000 }
  )
})

type DatabaseConfig = typeof DatabaseConfig.Type
```

## Complete Application Config

Compose configs together:

```typescript
const RedisConfig = Schema.Struct({
  url: Schema.String.pipe(Schema.nonEmptyString()),
  password: Schema.optional(Schema.String),
  db: Schema.optional(
    Schema.NumberFromString.pipe(Schema.int(), Schema.between(0, 15)),
    { default: () => 0 }
  )
})

const ServerConfig = Schema.Struct({
  host: Schema.optional(Schema.String, { default: () => "0.0.0.0" }),
  port: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.between(1, 65535)
  ),
  cors: Schema.optional(Schema.Struct({
    origin: Schema.optional(Schema.String, { default: () => "*" }),
    credentials: Schema.optional(Schema.BooleanFromString, { 
      default: () => false 
    })
  }), { 
    default: () => ({ origin: "*", credentials: false }) 
  })
})

const FullConfig = Schema.Struct({
  nodeEnv: Schema.Literal("development", "staging", "production"),
  server: ServerConfig,
  database: DatabaseConfig,
  redis: Schema.optional(RedisConfig),
  logLevel: Schema.optional(
    Schema.Literal("debug", "info", "warn", "error"),
    { default: () => "info" as const }
  )
})

type FullConfig = typeof FullConfig.Type
```

## Loading Configuration

Create a loader function that maps environment variables:

```typescript
function loadConfig(): FullConfig {
  return Schema.decodeUnknownSync(FullConfig)({
    nodeEnv: process.env.NODE_ENV,
    server: {
      host: process.env.HOST,
      port: process.env.PORT,
      cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: process.env.CORS_CREDENTIALS
      }
    },
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL,
      poolSize: process.env.DB_POOL_SIZE,
      connectionTimeout: process.env.DB_TIMEOUT
    },
    redis: process.env.REDIS_URL ? {
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB
    } : undefined,
    logLevel: process.env.LOG_LEVEL
  })
}

// Usage
try {
  const config = loadConfig()
  
  // Everything is typed correctly
  console.log(`Starting in ${config.nodeEnv} mode`)
  console.log(`Server: ${config.server.host}:${config.server.port}`)
  console.log(`Database pool: ${config.database.poolSize} connections`)
  
} catch (error) {
  console.error("Configuration error:", error)
  process.exit(1)
}
```

## Environment-Specific Configs

Handle different configurations per environment:

```typescript
const BaseConfig = Schema.Struct({
  nodeEnv: Schema.Literal("development", "staging", "production"),
  port: Schema.NumberFromString.pipe(Schema.int()),
  logLevel: Schema.Literal("debug", "info", "warn", "error")
})

const DevelopmentConfig = Schema.Struct({
  ...BaseConfig.fields,
  nodeEnv: Schema.Literal("development"),
  debug: Schema.optional(Schema.BooleanFromString, { default: () => true }),
  mockExternalServices: Schema.optional(Schema.BooleanFromString, { 
    default: () => true 
  })
})

const ProductionConfig = Schema.Struct({
  ...BaseConfig.fields,
  nodeEnv: Schema.Literal("production"),
  sentryDsn: Schema.String.pipe(Schema.nonEmptyString()),
  analyticsId: Schema.String.pipe(Schema.nonEmptyString())
})

// Parse based on NODE_ENV
function loadEnvConfig() {
  const env = process.env.NODE_ENV
  
  if (env === "development") {
    return Schema.decodeUnknownSync(DevelopmentConfig)(process.env)
  } else if (env === "production") {
    return Schema.decodeUnknownSync(ProductionConfig)(process.env)
  }
  
  throw new Error(`Unknown NODE_ENV: ${env}`)
}
```

## JSON/YAML Config Files

Parse configuration from JSON files:

```typescript
import { readFileSync } from "fs"

const FileConfig = Schema.Struct({
  server: Schema.Struct({
    port: Schema.Number.pipe(Schema.int()),
    host: Schema.optional(Schema.String)
  }),
  features: Schema.Struct({
    enableBeta: Schema.optional(Schema.Boolean, { default: () => false }),
    maxUploadSize: Schema.optional(Schema.Number, { 
      default: () => 10 * 1024 * 1024  // 10MB
    })
  })
})

function loadFileConfig(path: string) {
  const content = readFileSync(path, "utf-8")
  const json = JSON.parse(content)
  return Schema.decodeUnknownSync(FileConfig)(json)
}
```

## Validation Errors

Schema provides clear error messages for config issues:

```typescript
try {
  const config = loadConfig()
} catch (error) {
  if (error instanceof ParseError) {
    // Structured error information
    console.error("Config validation failed:")
    console.error(TreeFormatter.formatErrorSync(error))
    
    // Example output:
    // Config validation failed:
    // └─ ["database"]["port"]
    //    └─ Expected a number between 1 and 65535, got 70000
  }
}
```

## Key Takeaways

1. **Automatic coercion** - `NumberFromString`, `BooleanFromString` handle env vars
2. **Defaults** - Use `Schema.optional` with `default` for optional values
3. **Validation** - Range checks, patterns, and custom validators
4. **Composition** - Build complex configs from simple pieces
5. **Type safety** - Full TypeScript inference from schema

## Next Steps

- [Core Concepts](/guide/core-concepts) - Understand Schema fundamentals
- [Transformations](/guide/transformations) - Custom type transformations
- [Domain Modeling](/examples/domain-modeling) - Complex type design
