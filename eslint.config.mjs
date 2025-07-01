import pluginJs from "@eslint/js";
import pluginImport from "eslint-plugin-import";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginNextJs from "@next/eslint-plugin-next";
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
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  securityPlugin.configs.recommended,

  // Global ignores
  {
    ignores: [
      ".github/",
      ".husky/", 
      "node_modules/",
      ".next/",
      "out/",
      "dist/",
      "build/",
      "src/components/ui/**",
      "*.config.ts",
      "*.config.js",
      "*.config.mjs",
      "coverage/",
      ".vercel/",
      ".turbo/",
    ],
  },

  // Main configuration
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2025,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
    },
    plugins: {
      "@next/next": pluginNextJs,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
      import: pluginImport,
      security: securityPlugin,
      prettier: prettier,
      unicorn: unicorn,
      sonarjs: sonarjs,
      "unused-imports": unusedImports,
    },
    rules: {
      // Core Next.js rules
      ...pluginNextJs.configs.recommended.rules,
      ...pluginNextJs.configs["core-web-vitals"].rules,
      
      // React hooks rules
      ...pluginReactHooks.configs.recommended.rules,
      
      // A11y rules
      ...pluginJsxA11y.configs.recommended.rules,

      // Prettier integration
      "prettier/prettier": "warn",

      // File naming conventions (kebab-case for consistency)
      "unicorn/filename-case": [
        "error",
        {
          case: "kebabCase",
          ignore: ["^.*\\.config\\.(js|ts|mjs)$", "^.*\\.d\\.ts$", "README.md"],
        },
      ],

      // Modern JavaScript/TypeScript practices
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "prefer-const": "error",
      "no-var": "error",
      "prefer-template": "error",
      "prefer-arrow-callback": "error",
      "arrow-spacing": "error",
      "no-duplicate-imports": "off", // Handled by unused-imports
      
      // Import organization and cleanup
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { 
          vars: "all", 
          varsIgnorePattern: "^_", 
          args: "after-used", 
          argsIgnorePattern: "^_" 
        },
      ],
      "import/no-mutable-exports": "error",
      "import/no-cycle": ["error", { maxDepth: 3 }],
      "import/no-self-import": "error",
      "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external", 
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "{next,next/**}",
              group: "external",
              position: "before",
            },
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          distinctGroup: false,
        },
      ],
      "import/newline-after-import": "error",
      "import/first": "error",

      // Code quality and complexity
      complexity: ["error", { max: 12 }],
      "max-lines": ["error", { max: 350, skipBlankLines: true, skipComments: true }],
      "max-depth": ["error", 4],
      "max-params": ["error", 4],
      "max-nested-callbacks": ["error", 3],

      // TypeScript-specific rules (enhanced for strict mode)
      "@typescript-eslint/no-unused-vars": "off", // Handled by unused-imports
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/return-await": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/prefer-string-starts-ends-with": "error",
      "@typescript-eslint/prefer-includes": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],

      // React/JSX rules (enhanced for React 19)
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/jsx-uses-react": "off", // Not needed in React 17+
      "react/prop-types": "off", // Using TypeScript
      "react/jsx-no-useless-fragment": ["warn", { allowExpressions: true }],
      "react/jsx-pascal-case": [
        "error",
        { allowAllCaps: false, ignore: [] },
      ],
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      "react/jsx-no-constructed-context-values": "error",
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-curly-brace-presence": [
        "error", 
        { props: "never", children: "never" }
      ],
      "react/self-closing-comp": "error",
      "react/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          shorthandFirst: true,
          multiline: "last",
          reservedFirst: true,
        },
      ],

      // Security enhancements
      "security/detect-object-injection": "warn", // Can be noisy
      "security/detect-non-literal-regexp": "warn",

      // Unicorn plugin rules (modern JS practices)
      "unicorn/better-regex": "error",
      "unicorn/catch-error-name": "error",
      "unicorn/consistent-destructuring": "error",
      "unicorn/no-array-for-each": "off", // forEach is fine
      "unicorn/no-null": "off", // null is fine in React
      "unicorn/prevent-abbreviations": "off", // Too strict
      "unicorn/prefer-module": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-top-level-await": "error",
      "unicorn/prefer-ternary": "error",

      // SonarJS rules
      "sonarjs/no-commented-code": "warn",
      "sonarjs/no-duplicate-string": ["error", { threshold: 5 }],
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-identical-functions": "error",

      // Accessibility enhancements  
      "jsx-a11y/alt-text": ["error", { elements: ["img", "object", "area", "input[type=\"image\"]"] }],
      "jsx-a11y/anchor-is-valid": ["error", { components: ["Link"], specialLink: ["hrefLeft", "hrefRight"] }],

      // Spacing and formatting (delegated to Prettier mostly)
      "spaced-comment": ["error", "always", { exceptions: ["-", "+", "*"] }],
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
      "eol-last": ["error", "always"],
    },
  },

  // Specific overrides for configuration files
  {
    files: ["*.config.{js,mjs,ts}", "tailwind.config.{js,ts}"],
    rules: {
      "unicorn/filename-case": "off",
      "@typescript-eslint/no-var-requires": "off",
      "import/no-default-export": "off",
    },
  },

  // Override for test files when they exist
  {
    files: ["**/*.{test,spec}.{js,jsx,ts,tsx}", "**/__tests__/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "sonarjs/no-duplicate-string": "off",
      "max-lines": "off",
    },
  },

  // Override for type declaration files
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/consistent-type-definitions": "off",
      "unicorn/filename-case": "off",
    },
  }
);
