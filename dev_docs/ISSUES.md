# Migration Issues Tracker

> Track all unresolved issues, blockers, and questions encountered during migration.
> **Update this file immediately when you encounter an issue.**

## Open Issues

| ID | Severity | Area | Description | Notes |
|----|----------|------|-------------|-------|
| I-001 | High | Build | ESM import resolution: bundled code fails with `Cannot find module 'vscode-jsonrpc/node'` | Need `.js` extension in imports for Node ESM |

### I-001: ESM Import Resolution

**Problem**: When running the bundled `dist/opencode.mjs`, Node.js ESM resolver fails:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'vscode-jsonrpc/node'
Did you mean to import "vscode-jsonrpc/node.js"?
```

**Root Cause**: esbuild with `packages: "external"` doesn't add `.js` extensions to import paths, but Node.js ESM requires them.

**GPT-5 Consultation Summary**:
- Full bundling (all deps inline) doesn't work due to CJS→ESM conversion issues with dynamic requires
- Partial bundling (`packages: external`) avoids CJS issues but has import resolution problems
- Options:
  1. **Run unbundled** - simplest, just use tsx in production
  2. **Use esbuild plugin** to add `.js` extensions to imports
  3. **Rollup** handles mixed ESM/CJS better
  4. **Bundle to CJS** and remove top-level await

**Recommended Next Step**: Either (a) run unbundled with tsx in production, or (b) investigate esbuild plugin to fix import paths.

## Resolved Issues

| ID | Area | Description | Resolution |
|----|------|-------------|------------|
| - | - | - | - |

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
