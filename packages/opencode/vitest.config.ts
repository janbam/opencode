import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // setupFiles runs BEFORE test files are imported, but AFTER module resolution
    // This doesn't work for zod-openapi extension which needs to run before ANY imports
    setupFiles: ["./test/setup.ts"],
    deps: {
      // Force vitest to use the node module loader for these packages
      // This ensures zod-openapi/extend is processed correctly
      interopDefault: true,
    },
  },
})
