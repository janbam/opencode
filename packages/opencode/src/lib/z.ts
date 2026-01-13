/**
 * Centralized Zod export with OpenAPI extension
 *
 * This module ensures the zod-openapi extension is applied exactly once,
 * before any code uses .openapi(). All modules that use .openapi() should
 * import z from here instead of directly from "zod".
 *
 * Why this pattern:
 * - Runtime: guarantees extension runs before any .openapi() call
 * - Types: works with moduleResolution: "Bundler" via local augmentation
 * - Vitest: no special setup needed - extension happens on first import
 * - Idempotent: global guard handles HMR / multiple workers safely
 */

import { z } from "zod"
import { extendZodWithOpenApi } from "zod-openapi"

// Idempotent guard (handles HMR / multiple workers)
declare global {
  // eslint-disable-next-line no-var
  var __ZOD_OPENAPI_EXTENDED__: boolean | undefined
}

if (!globalThis.__ZOD_OPENAPI_EXTENDED__) {
  // Cast to any to work around pnpm zod version mismatch between
  // zod-openapi's bundled types and our zod dependency
  extendZodWithOpenApi(z as any)
  globalThis.__ZOD_OPENAPI_EXTENDED__ = true
}

// Re-export z and all zod types
export { z }
export * from "zod"
