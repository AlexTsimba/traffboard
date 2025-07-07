import pluginJs from "@eslint/js";
import pluginImport from "eslint-plugin-import";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginNext from "@next/eslint-plugin-next";
import globals from "globals";
import tseslint from "typescript-eslint";
import securityPlugin from "eslint-plugin-security";
import prettier from "eslint-plugin-prettier";
import unicorn from "eslint-plugin-unicorn";
import sonarjs from "eslint-plugin-sonarjs";
import unusedImports from "eslint-plugin-unused-imports";

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  // Base configurations
  pluginJs.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Main configuration
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2024,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
      "@next/next": pluginNext,
      import: pluginImport,
      security: securityPlugin,
      prettier: prettier,
      unicorn: unicorn,
      sonarjs: sonarjs,
      "unused-imports": unusedImports,
    },
    rules: {
      // TypeScript ESLint 2025 best practices
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // TypeScript strict rules - make more pragmatic for real projects
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off", 
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "warn",
        {
          allowNumber: true,
          allowBoolean: true,
          allowAny: false,
          allowNullish: true,
          allowRegExp: false,
        },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],

      // Reduce strictness for better DX
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-redundant-type-constituents": "warn",

      // React rules
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-sort-props": "off",

      // Next.js rules - using core-web-vitals config
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,

      // JSX A11y rules - balanced approach
      ...pluginJsxA11y.configs.recommended.rules,
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/anchor-is-valid": [
        "error",
        {
          components: ["Link"],
          specialLinkComponents: ["hrefLeft", "hrefRight"],
          aspects: ["invalidHref", "preferButton"],
        },
      ],

      // Import rules
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      // Security
      ...securityPlugin.configs.recommended.rules,
      "security/detect-object-injection": "warn",

      // Code quality - make less strict
      ...sonarjs.configs.recommended.rules,
      "sonarjs/prefer-read-only-props": "warn",
      "sonarjs/no-nested-conditional": "warn",
      "sonarjs/table-header": "warn",
      "sonarjs/pseudo-random": "warn",

      ...unicorn.configs.recommended.rules,
      "unicorn/no-nested-ternary": "warn",
      "unicorn/no-array-reduce": "off",
      "unicorn/prefer-ternary": "warn",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/filename-case": "off",
      "unicorn/no-null": "off",
      "unicorn/no-document-cookie": "warn",
      "unicorn/explicit-length-check": "off",

      // Prettier integration - change to warn to not block CI
      "prettier/prettier": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
      // Fix Next.js settings for proper plugin detection
      next: {
        rootDir: ".",
      },
    },
  },

  // Add specific Next.js configuration for better plugin detection
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      // Ensure Next.js specific rules are properly applied
      "@next/next/no-img-element": "error",
      "@next/next/no-page-custom-font": "error",
    },
  },

  // Test files configuration - relaxed rules for testing
  // Rationale: Test files need flexibility for mocks, test data, and comprehensive test scenarios
  // This configuration maintains code quality where it matters while enabling productive testing
  {
    files: [
      "**/__tests__/**/*.{js,ts,tsx}",
      "**/*.{test,spec}.{js,ts,tsx}",
      "**/tests/**/*.{js,ts,tsx}",
      "**/test/**/*.{js,ts,tsx}",
    ],
    rules: {
      // Allow any types in test files - common for mocks and test data
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      
      // Relax async/await requirements for test helpers
      "@typescript-eslint/require-await": "off",
      
      // Allow non-null assertions in tests
      "@typescript-eslint/no-non-null-assertion": "off",
      
      // Allow empty functions in test mocks
      "@typescript-eslint/no-empty-function": "off",
      
      // Relax complexity rules for comprehensive test scenarios
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/no-duplicated-branches": "off",
      
      // Allow console.log for test debugging
      "no-console": "off",
      
      // Relax accessibility rules for test components
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      
      // Allow missing display names for test components
      "react/display-name": "off",
      
      // Allow string comparisons with different types in tests
      "sonarjs/different-types-comparison": "off",
      
      // Allow object injection patterns for test data
      "security/detect-object-injection": "off",
      "security/detect-non-literal-regexp": "off",
      
      // Allow dynamic property deletion in test cleanup
      "@typescript-eslint/no-dynamic-delete": "off",
      
      // Allow base-to-string conversions for test assertions
      "@typescript-eslint/no-base-to-string": "off",
    },
  },

  // Global ignores
  {
    ignores: [
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/.git/**",
      "**/coverage/**",
      "**/*.min.js",
      "**/public/**",
      "**/.env*",
      "**/next-env.d.ts",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.ts",
      // Exclude UI library components from strict linting
      "src/components/ui/**/*.tsx",
      "src/components/ui/**/*.ts",
    ],
  },
);
