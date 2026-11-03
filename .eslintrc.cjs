/**
 * ESLint configuration for AgroGrowth.
 *
 * The project mixes a Vite/React SPA (client/) with an Express backend (server/)
 * and shared types (shared/). `tsconfig.json` intentionally runs with relaxed
 * strictness flags, so the rules below focus on real correctness problems
 * (hooks usage, obvious mistakes) rather than stylistic preferences.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
    jest: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react-hooks", "react-refresh"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  settings: {
    react: { version: "detect" },
  },
  ignorePatterns: [
    "dist",
    "node_modules",
    "coverage",
    "*.config.js",
    "*.config.cjs",
    "*.config.ts",
    "agrogrowth-ai",
    "cypress",
    "vite.config.ts.timestamp-*.mjs",
  ],
  rules: {
    // The codebase is a large, evolving application; keep noisy rules off so
    // that lint output stays actionable and the CI gate remains meaningful.
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-constant-condition": ["error", { checkLoops: false }],
    "no-control-regex": "off",
    "no-useless-escape": "off",
    "prefer-const": "off",
    "react-hooks/exhaustive-deps": "off",
    "react-refresh/only-export-components": "off",
    "no-console": "off",
    "no-debugger": "warn",
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
      env: { jest: true, node: true },
      rules: {
        "@typescript-eslint/no-unused-expressions": "off",
      },
    },
  ],
};
