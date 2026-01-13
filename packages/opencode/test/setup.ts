// Test setup: Load zod-openapi extension before any tests run
// This is required because tests import modules directly without going through src/index.ts
import "zod-openapi/extend"
