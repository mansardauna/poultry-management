import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Treat explicit `any` as a warning (not an error) so `npm run lint` stays green
  // while still surfacing untyped values during review.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // React 19's strict compiler-era rules flag intentional patterns used across
      // this codebase (e.g. hydrating client state from cookies/localStorage in effects).
      // Keep them as warnings so they are visible without failing the build.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      // Straight quotes/apostrophes in natural-language copy render correctly in React.
      "react/no-unescaped-entities": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local, gitignored development-only scripts (Playwright screenshots)
    "scratch/**",
  ]),
]);

export default eslintConfig;
