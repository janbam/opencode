/**
 * Centralized Zod export with OpenAPI extension
 *
 * NO-BUN: This module ensures zod-openapi extension is applied before any code uses .openapi()
 *
 * All modules that use z.schema().openapi() should import z from here instead of directly from "zod"
 */

import { z, type ZodSchema, type ZodType } from "zod"
import { extendZodWithOpenApi } from "zod-openapi"

// Extend zod with openapi method - this modifies the prototype
extendZodWithOpenApi(z)

// Re-export z and commonly used types
export { z, type ZodSchema, type ZodType }
export default z
