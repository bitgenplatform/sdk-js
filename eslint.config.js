import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist/', 'node_modules/']),

  // Tooling files (this config…): plain JS rules, no type information
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
  },

  // Tests (node:test) and build scripts: Node.js globals, no type information
  {
    files: ['tests/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: { process: 'readonly', URL: 'readonly', Buffer: 'readonly', TextEncoder: 'readonly' },
    },
  },

  // SDK sources: TypeScript rules with type information (tsconfig.json)
  {
    files: ['src/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      camelcase: 'error',
      'spaced-comment': ['error', 'always', { markers: ['/'] }],
      'no-duplicate-imports': 'error',
      quotes: 'off',
      // A library never logs: any leftover console.* is flagged
      'no-console': 'warn',
    },
  },
])
