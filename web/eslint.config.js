import { defineConfig } from 'eslint-define-config';

export default defineConfig([
  {
    root: true,
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    extends: [
      'next/core-web-vitals',
      '@typescript-eslint/recommended',
      'prettier'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    plugins: ['@typescript-eslint', 'prettier'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/prefer-const': 'error',
      'prettier/prettier': 'error',
      'no-console': 'warn',
    },
    ignorePatterns: [
      '.next/',
      'out/',
      'node_modules/',
      '*.config.js',
      '.eslintrc.js',
    ],
  },
]);