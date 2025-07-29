/**
 * @type {import('lint-staged').Configuration}
 * Advanced lint-staged configuration optimized for TypeScript + Next.js
 */
import path from 'path'

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`

export default {
  // TypeScript files: ESLint with Next.js integration + TypeScript check
  '**/*.{ts,tsx}': [
    buildEslintCommand,
    // Function syntax prevents lint-staged from appending filenames to tsc
    () => 'tsc --noEmit --pretty --incremental',
  ],
  
  // JavaScript files: ESLint only
  '**/*.{js,jsx}': [buildEslintCommand],
  
  // JSON/Config files: Prettier
  '**/*.{json,jsonc}': ['prettier --write'],
  
  // Markdown: Prettier
  '**/*.{md,mdx}': ['prettier --write'],
  
  // CSS/Style files: Prettier
  '**/*.{css,scss,sass}': ['prettier --write'],
}