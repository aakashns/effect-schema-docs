import { defineConfig } from 'vitepress'

function guideSidebar() {
  return [
    {
      text: 'Introduction',
      items: [
        { text: 'What is Effect Schema?', link: '/guide/introduction' },
        { text: 'Installation', link: '/guide/installation' },
        { text: 'Quick Start', link: '/guide/quick-start' },
        { text: 'Core Concepts', link: '/guide/core-concepts' },
      ]
    },
    {
      text: 'Defining Schemas',
      items: [
        { text: 'Primitives', link: '/guide/primitives' },
        { text: 'Literals & Enums', link: '/guide/literals-enums' },
        { text: 'Structs', link: '/guide/structs' },
        { text: 'Arrays & Tuples', link: '/guide/arrays-tuples' },
        { text: 'Unions', link: '/guide/unions' },
        { text: 'Records', link: '/guide/records' },
        { text: 'Optional & Nullable', link: '/guide/optional-nullable' },
      ]
    },
    {
      text: 'Validation & Refinements',
      items: [
        { text: 'Built-in Filters', link: '/guide/filters' },
        { text: 'Custom Filters', link: '/guide/custom-filters' },
        { text: 'Error Messages', link: '/guide/error-messages' },
        { text: 'Parse Options', link: '/guide/parse-options' },
      ]
    },
    {
      text: 'Transformations',
      items: [
        { text: 'Understanding Transformations', link: '/guide/transformations' },
        { text: 'Built-in Transformations', link: '/guide/builtin-transformations' },
        { text: 'Custom Transformations', link: '/guide/custom-transformations' },
        { text: 'Effectful Transformations', link: '/guide/effectful-transformations' },
      ]
    },
    {
      text: 'Advanced Features',
      items: [
        { text: 'Brands', link: '/guide/brands' },
        { text: 'Classes', link: '/guide/classes' },
        { text: 'Recursive Schemas', link: '/guide/recursive-schemas' },
        { text: 'Extending Schemas', link: '/guide/extending-schemas' },
        { text: 'Annotations', link: '/guide/annotations' },
      ]
    },
    {
      text: 'Effect Types',
      items: [
        { text: 'Option', link: '/guide/effect-option' },
        { text: 'Either', link: '/guide/effect-either' },
        { text: 'Cause & Exit', link: '/guide/effect-cause-exit' },
        { text: 'Data Types', link: '/guide/effect-data-types' },
      ]
    },
    {
      text: 'Integrations',
      items: [
        { text: 'JSON Schema', link: '/guide/json-schema' },
        { text: 'Property Testing', link: '/guide/arbitrary' },
        { text: 'Pretty Printing', link: '/guide/pretty' },
        { text: 'Equivalence', link: '/guide/equivalence' },
      ]
    },
    {
      text: 'Examples',
      items: [
        { text: 'Overview', link: '/examples/' },
        { text: 'API Validation', link: '/examples/api-validation' },
        { text: 'Form Validation', link: '/examples/form-validation' },
        { text: 'Configuration', link: '/examples/configuration' },
        { text: 'Domain Modeling', link: '/examples/domain-modeling' },
        { text: 'Database Integration', link: '/examples/database-integration' },
        { text: 'WebSocket Messages', link: '/examples/websocket-messages' },
      ]
    },
    {
      text: 'Coming from Zod',
      items: [
        { text: 'Overview', link: '/zod-comparison/' },
        { text: 'Feature Comparison', link: '/zod-comparison/features' },
        { text: 'Migration Guide', link: '/zod-comparison/migration' },
      ]
    },
    {
      text: 'Best Practices',
      items: [
        { text: 'Schema Design', link: '/best-practices/' },
        { text: 'Performance', link: '/best-practices/performance' },
        { text: 'Testing', link: '/best-practices/testing' },
      ]
    },
    {
      text: 'FAQ',
      items: [
        { text: 'Common Questions', link: '/faq/' },
      ]
    },
  ]
}

export default defineConfig({
  title: 'Effect Schema',
  description: 'Type-safe validation and transformation for TypeScript',
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Effect Schema' }],
    ['meta', { property: 'og:description', content: 'Type-safe validation and transformation for TypeScript' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Effect', link: 'https://effect.website' }
    ],

    sidebar: {
      '/guide/': guideSidebar(),
      '/zod-comparison/': guideSidebar(),
      '/best-practices/': guideSidebar(),
      '/examples/': guideSidebar(),
      '/faq/': guideSidebar(),
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Effect-TS/effect' },
      { icon: 'discord', link: 'https://discord.gg/effect-ts' },
      { icon: 'x', link: 'https://twitter.com/EffectTS_' }
    ],

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/Effect-TS/effect/edit/main/schema-docs/:path',
      text: 'Edit this page on GitHub'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Effect Contributors'
    }
  },

})

