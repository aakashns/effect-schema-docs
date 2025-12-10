# Effect Schema Documentation

This is the documentation site for Effect Schema, built with [VitePress](https://vitepress.dev/).

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Structure

```
schema-docs/
├── .vitepress/
│   ├── config.ts          # VitePress configuration
│   └── theme/
│       ├── index.ts       # Theme customization
│       └── custom.css     # Custom styles
├── public/
│   ├── logo.svg           # Site logo
│   └── favicon.svg        # Site favicon
├── guide/
│   ├── introduction.md    # What is Effect Schema
│   ├── installation.md    # Installation guide
│   ├── quick-start.md     # Quick start tutorial
│   ├── core-concepts.md   # Type/Encoded, decode/encode
│   ├── primitives.md      # String, Number, Boolean, etc.
│   ├── literals-enums.md  # Literal values and TypeScript enums
│   ├── structs.md         # Object schemas
│   ├── arrays-tuples.md   # Array and tuple schemas
│   ├── unions.md          # Union types
│   ├── records.md         # Dynamic key-value objects
│   ├── optional-nullable.md # Optional and nullable handling
│   ├── filters.md         # Built-in validation filters
│   ├── transformations.md # Type transformations
│   ├── brands.md          # Nominal typing
│   ├── classes.md         # Schema-backed classes
│   └── json-schema.md     # JSON Schema generation
├── zod-comparison/
│   ├── index.md           # Feature comparison
│   └── migration.md       # Migration guide from Zod
├── best-practices/
│   └── index.md           # Schema design best practices
├── api/
│   └── index.md           # API quick reference
├── examples/
│   └── index.md           # Practical code examples
├── faq/
│   └── index.md           # Frequently asked questions
├── index.md               # Home page
└── package.json           # Package dependencies
```

## Writing Documentation

### Front Matter

Each markdown file should have front matter:

```yaml
---
title: Page Title
description: Page description for SEO
---
```

### Code Examples

Use TypeScript for all code examples:

````markdown
```typescript
import { Schema } from "effect"

const User = Schema.Struct({
  name: Schema.String,
  age: Schema.Number
})
```
````

### Comparing with Zod

Use code groups:

````markdown
::: code-group

```typescript [Effect Schema]
// Effect Schema code
```

```typescript [Zod]
// Zod code
```

:::
````

### Tips and Warnings

```markdown
::: tip Title
Tip content
:::

::: warning
Warning content
:::

::: danger
Danger content
:::
```

## Deployment

### Vercel

1. Push your code to a Git repository
2. Import the project in [Vercel](https://vercel.com)
3. Set the build command to `pnpm build`
4. Set the output directory to `.vitepress/dist`

### Netlify

1. Push your code to a Git repository
2. Import the project in [Netlify](https://netlify.com)
3. Set the build command to `pnpm build`
4. Set the publish directory to `.vitepress/dist`

### Cloudflare Pages

1. Push your code to a Git repository
2. Create a new project in [Cloudflare Pages](https://pages.cloudflare.com)
3. Set the build command to `pnpm build`
4. Set the build output directory to `.vitepress/dist`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

