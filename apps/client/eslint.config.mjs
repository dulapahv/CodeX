/**
 * ESLint configuration for the project.
 * Features:
 * - Next.js/TypeScript rules
 * - Core web vitals checking
 * - Prettier integration
 * - Ignore patterns
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  {
    ignores: [
      '**/node_modules/*',
      '**/.next/*',
      '**/playwright-report/*',
      '**/components/ui/*',
      'tailwind.config.ts',
      'out/**',
      'build/**',
      'next-env.d.ts'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx']
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier')
];

export default eslintConfig;
