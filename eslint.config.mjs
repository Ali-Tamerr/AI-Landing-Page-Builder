import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Build outputs
    ".next/**",
    "out/**",
    "build/**",
    ".cloudflare/**",
    // Generated files
    "next-env.d.ts",
    "cloudflare-env.d.ts",
    // Dependencies — must be explicit since we overrode Next's defaults
    "node_modules/**",
    // Static assets
    "public/**",
  ]),
]);

export default eslintConfig;
