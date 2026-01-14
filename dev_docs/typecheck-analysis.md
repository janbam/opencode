# TypeScript Type Error Analysis

> Analyzed: 2025-01-13
> Branch: `no-bun`
> Initial errors: 189
> After lib fix: **174**

## Summary

The migration from Bun to Node.js revealed type errors that were previously hidden by Bun's permissive type system. Most are NOT new bugs — they're pre-existing issues that `@tsconfig/bun` and `@types/bun` masked.

## Current Status (After Session ec8d4131)

| Category | Count | Status |
|----------|-------|--------|
| ES2023+ methods | ~~7~~ | ✅ Fixed by `lib: ESNext` |
| `.openapi()` not found on Zod types | ~~59~~ | ✅ Fixed by local augmentation shim |
| `unknown` type errors | **~57** | Needs type assertions |
| Other property access errors | **~30** | Case-by-case fixes needed |
| Other (assignments, params) | **~30** | Case-by-case fixes needed |
| **Total** | **126** | |

## Root Causes

### 1. Direct Migration Cause (7 errors) — ✅ FIXED

The original `@tsconfig/bun` uses `lib: ESNext`. Our migration initially changed to `lib: ES2022`, which broke ES2023+ methods like `findLast`, `toReversed`, and Iterator helpers.

**Resolution**: Updated tsconfig to `lib: ESNext` and `target: ESNext`.

### 2. Zod-OpenAPI Type Augmentation (59 errors) — ✅ FIXED

**Root cause (per GPT5):** `moduleResolution: "Bundler"` follows `package.json` exports strictly. The subpath `zod-openapi/extend` doesn't expose types, so TypeScript never loaded the augmentation.

**Solution:** Created local augmentation shim `src/types/zod-openapi-augment.d.ts`:
```typescript
import 'zod';
declare module 'zod' {
  interface ZodType {
    openapi<T extends import('zod').ZodTypeAny>(
      this: T,
      metadata: import('zod-openapi').ZodOpenApiMetadata<T>
    ): T;
  }
}
```

**Cleanup done:**
- Deleted `util/zod.ts` (was for bundling, no longer needed with tsx)
- Reverted imports from `../util/zod` back to `zod`
- Kept `import "zod-openapi/extend"` in `src/index.ts` for runtime extension

See `dev_docs/gpt5-zod-openapi-fix.md` for full GPT5 analysis.

### 3. Unknown Type Errors (57 errors)

These are from:
- `fetch().json()` returning `unknown` (standard TypeScript behavior)
- Event properties being `unknown`
- Other untyped data flows

Bun's types likely provided more permissive return types.

**Fix**: Add proper type assertions or Zod parsing where data crosses boundaries.

### 4. Other Property Access Errors (~30 errors)

Various issues like:
- Accessing properties on `never` types
- Type narrowing not working correctly
- Incorrect type definitions

**Fix**: Case-by-case analysis needed.

## Why These Weren't Caught Before

1. **`@tsconfig/bun` is permissive**: Uses ESNext lib, has Bun-specific globals
2. **`@types/bun` provides loose types**: Bun's runtime APIs may have had `any` or broad union types
3. **No CI enforcement**: Type checking may not have been strictly enforced in CI

## Recommended Fix Order

1. ✅ ~~Update `lib` to `ESNext`~~ — Done (189 → 174)
2. ✅ ~~Fix zod-openapi type augmentation~~ — Done (174 → 126)
3. Add type assertions for fetch/unknown — will eliminate ~57 errors
4. Address remaining errors case-by-case (~30 errors)

## Notes

The codebase was never truly type-safe under strict TypeScript. The migration exposed technical debt that existed under Bun's type system.
