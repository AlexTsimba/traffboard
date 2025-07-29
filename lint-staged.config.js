/**
 * @fileoverview Advanced lint-staged configuration optimized for TypeScript + Next.js
 * @type {import('lint-staged').Configuration}
 */
import path from 'path'

/**
 * Build ESLint command with Next.js integration for staged files
 * @param {string[]} stagedFileNames - Array of staged file paths
 * @returns {string} ESLint command with file arguments
 */
const buildEslintCommand = (stagedFileNames) =>
  `next lint --fix --file ${stagedFileNames
    .map((/** @type {string} */ f) => path.relative(process.cwd(), f))
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