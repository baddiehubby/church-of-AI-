// Assumptions: unit tests only (pure lib modules), node environment, no network. "server-only" is stubbed so
// visaWishes and other server modules can be imported.

import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": root,
      "server-only": path.join(root, "lib", "server-only-stub.ts"),
    },
  },
});
