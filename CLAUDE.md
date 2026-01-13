# opencode: Node.js Version

**Branch:** `no-bun`
**Status:** ✅ Migration Complete — runs on Node.js 22+

## Current State

- All Bun dependencies removed
- 33 files migrated to Node.js equivalents
- Compat layer at `src/compat/` provides drop-in replacements
- Build: `pnpm build` (tsx-based, ~1s)
- Dev: `pnpm dev` (tsx watch mode)
- Tests: 42/46 passing (4 pre-existing failures in I-002)

## Scope Constraints (unchanged)

1. **Linux only** — No Windows, no macOS
2. **Local deployment only** — No npm publishing, no GitHub releases
3. **Simple approach** — tsx for both dev and prod (no bundling)

## Code Convention: NO-BUN Markers

Original Bun code is preserved as comments with `// NO-BUN:` markers:
```typescript
// NO-BUN: replaced Bun.file/Bun.write with fs/promises
// // const file = Bun.file(filepath);
const content = await readFile(filepath, 'utf8');
```

## Key Files

- `dev_docs/PROGRESS.md` — Migration history and completion status
- `dev_docs/ISSUES.md` — Known issues (I-002: 4 pre-existing test failures)
- `src/compat/` — Node.js compatibility layer

## API Mappings Reference

| Bun API | Node.js Replacement |
|---------|---------------------|
| `Bun.file()` / `Bun.write()` | `src/compat/file.ts` |
| `Bun.spawn()` | `src/compat/spawn.ts` (execa) |
| `Bun.Glob` | `src/compat/glob.ts` |
| `Bun.which()` | `src/compat/which.ts` |
| `Bun.serve()` | `@hono/node-server` |
| `$ from "bun"` | `src/compat/shell.ts` (execa.$) |
| `Bun.embeddedFiles` | `src/tui/index.ts` (binary lookup) |

## Commands

```bash
pnpm dev          # Development mode (tsx watch)
pnpm build        # Build TUI binary + launcher
pnpm test         # Run tests (vitest)
./dist/opencode   # Run built version
```
