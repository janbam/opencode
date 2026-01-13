# Migration Issues Tracker

> Track all unresolved issues, blockers, and questions encountered during migration.
> **Update this file immediately when you encounter an issue.**

## Open Issues

| ID | Severity | Area | Description | Notes |
|----|----------|------|-------------|-------|
| I-002 | Low | Tests | 4 edit.test.ts failures (EscapeNormalizedReplacer) | Pre-existing logic bug, not migration-related |
| I-003 | High | Runtime | Server.address() returns null on startup | Blocks TUI launch, needs investigation |
| ~~I-004~~ | ~~Low~~ | ~~Types~~ | ~~19 pnpm type inference errors~~ | **RESOLVED**: disabled declaration emit |

### I-003: Server.address() Returns Null

**Symptom:** When running `./dist/opencode .` or `pnpm dev`, the app hangs with a blinking cursor.

**Error (from `--print-logs`):**
```
ERROR service=default name=TypeError message=Cannot read properties of null (reading 'address') fatal
```

**Location:** `src/server/server.ts:754`
```typescript
const nodeServer = serve({ ... })
const address = nodeServer.address() as AddressInfo  // <- returns null
```

**Root Cause:** The `@hono/node-server` `serve()` function returns immediately but the server may not be listening yet. `nodeServer.address()` returns `null` until the server is actually bound.

**Potential Fix:** Wait for the 'listening' event or use a callback pattern.

**Discovered:** Session f5bc3052

### I-002: EscapeNormalizedReplacer Test Failures (Pre-existing)

**Note**: This is NOT a migration issue. The tests for EscapeNormalizedReplacer (cases 19-22) fail because the replace logic doesn't handle escape sequences correctly.

Affected tests (in `packages/opencode/test/tool/edit.test.ts`):
- case 19: `\n` escape sequence handling
- case 20: Single quote escape handling
- case 21: Template literal escape handling
- case 22: Backslash path handling

**Status**: Low priority. Does not affect core functionality.

## Resolved Issues

| ID | Area | Description | Resolution |
|----|------|-------------|------------|
| I-001 | Build | ESM import resolution in bundled code | **Resolved**: Switched to tsx-based production build — no bundling needed |
| I-004 | Types | 19 pnpm type inference errors (TS2742, TS4094, TS4058) | **Resolved**: Disabled `declaration` and `declarationMap` in tsconfig (not needed for local deployment) |

### I-001: ESM Import Resolution (RESOLVED)

**Problem**: When running the bundled `dist/opencode.mjs`, Node.js ESM resolver fails:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'vscode-jsonrpc/node'
Did you mean to import "vscode-jsonrpc/node.js"?
```

**Root Cause**: esbuild with `packages: "external"` doesn't add `.js` extensions to import paths, but Node.js ESM requires them.

**Resolution**: Given the project constraints (Linux only, local deployment only), bundling complexity isn't justified. Switched to tsx-based production build:
- Build script now only builds Go TUI binary
- Launcher script uses `npx tsx` to run TypeScript source directly
- Bypasses all ESM bundling complexity
- Works perfectly, 1-second build time

---

## Issue Template

When adding an issue:

```markdown
| I-XXX | High/Medium/Low | Phase/File | Brief description | Context/attempts |
```

### Severity Guide
- **High**: Blocks migration progress
- **Medium**: Workaround exists but needs proper fix
- **Low**: Minor, can be deferred

---

## Known Risks (from planning)

These are anticipated issues from the initial investigation:

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Node SEA not mature enough | Medium | Fallback to TUI download approach |
| Alpine/musl incompatibility with SEA | Low | Provide tarball alternative |
| ESM/CJS interop issues | Medium | Use tsx in dev, esbuild CJS bundle for prod |
| Performance regression | Low | Benchmark critical paths |

---

## Questions for Human

| Question | Context | Status |
|----------|---------|--------|
| - | - | - |

*Add questions here that require human decision/input.*
