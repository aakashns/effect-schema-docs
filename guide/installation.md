---
title: Installation
description: Install Effect Schema in your TypeScript project
---

# Installation

Effect Schema is included in the main `effect` package. There's no separate package to install.

## Requirements

- **TypeScript**: 5.4 or higher
- **Node.js**: 18 or higher (for Node.js projects)
- **strict mode**: Must be enabled in `tsconfig.json`

## Install Effect

::: code-group

```bash [npm]
npm install effect
```

```bash [pnpm]
pnpm add effect
```

```bash [yarn]
yarn add effect
```

```bash [bun]
bun add effect
```

:::

## TypeScript Configuration

Effect Schema requires TypeScript's `strict` mode. Ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    // Recommended additional options
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler", // or "node16" / "nodenext"
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

::: warning Why strict mode?
Schema's type inference relies on strict mode features like `strictNullChecks` and `strictFunctionTypes`. Without strict mode, types won't be inferred correctly and you'll encounter confusing type errors.
:::

## Importing Schema

Import Schema from the `effect` package:

```typescript
import { Schema } from "effect"

// Now you can use Schema.String, Schema.Number, etc.
const mySchema = Schema.String
```

You can also import it with an alias if you prefer:

```typescript
import { Schema as S } from "effect"

const mySchema = S.String
```

## Verify Installation

Create a simple test file to verify everything works:

```typescript
// test-schema.ts
import { Schema } from "effect"

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})

type Person = typeof Person.Type

const result = Schema.decodeUnknownSync(Person)({
  name: "Alice",
  age: 30
})

console.log(result)
// { name: 'Alice', age: 30 }
```

Run it:

```bash
npx tsx test-schema.ts
```

If you see the output `{ name: 'Alice', age: 30 }`, you're all set!

## Editor Setup

### VS Code

For the best experience with Effect Schema in VS Code:

1. **Use the TypeScript version from your workspace**:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Select "TypeScript: Select TypeScript Version"
   - Choose "Use Workspace Version"

2. **Recommended extensions**:
   - [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens) - Inline error display
   - [Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors) - Better error formatting

### Other Editors

Schema works with any editor that supports TypeScript language services:
- **WebStorm/IntelliJ**: Works out of the box
- **Neovim**: Use with `typescript-language-server`
- **Sublime Text**: Use with LSP-typescript

## Bundle Size

Effect is tree-shakeable. When using a modern bundler (Vite, esbuild, Rollup, webpack 5+), only the parts you use are included in your bundle.

A minimal Schema usage typically adds **~10-15KB** (minified + gzipped) to your bundle.

## Using with Different Module Systems

### ESM (Recommended)

Effect is distributed as ESM. Modern bundlers and Node.js 18+ handle this natively:

```typescript
import { Schema } from "effect"
```

### CommonJS

If you're in a CommonJS environment, you may need to use dynamic import:

```javascript
const { Schema } = await import("effect")
```

Or configure your bundler to handle ESM modules.

## Next Steps

Now that Schema is installed, let's write your first schema:

→ [Quick Start](/guide/quick-start)

