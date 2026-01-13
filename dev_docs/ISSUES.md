# Migration Issues Tracker

> Track all unresolved issues, blockers, and questions encountered during migration.
> **Update this file immediately when you encounter an issue.**

## Open Issues

| ID | Severity | Area | Description | Notes |
|----|----------|------|-------------|-------|
| - | - | - | - | - |

## Resolved Issues

| ID | Area | Description | Resolution |
|----|------|-------------|------------|
| I-001 | Build | ESM import resolution in bundled code | **Resolved**: Switched to tsx-based production build — no bundling needed |

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
