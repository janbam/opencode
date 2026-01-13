# Migration Progress Tracker

> Branch: `no-bun`
> Started: 2025-01-13
> Last Updated: 2025-01-13
>
> **SCOPE: Linux only, local deployment only, no publishing**

## Current Status: 🟡 Phase 8 (E2E Testing) — Runtime issues discovered

### Session Log

| Date | Session ID | Work Done |
|------|------------|-----------|
| 2025-01-13 | a148fa34 | Initial investigation, GPT-5 consultation, created dev_docs |
| 2025-01-13 | 7d0f9a46 | **Phase 1 Complete** + **Compat Layer Complete**: pnpm, deps, tsconfig, src/compat/* |
| 2025-01-13 | 8bae2780 | **All tool files migrated** + **All file/* migrated**: 11 files total |
| 2025-01-13 | aff02b35 | **All easy file migrations**: session, auth, config, util, storage, global, app, provider: 12 files |
| 2025-01-13 | c3737d80 | **Medium files migrated**: format/*, lsp/*, installation, snapshot: 6 files |
| 2025-01-13 | 83c9457d | **Phase 2 Complete**: All 33 files migrated - server.ts, tui.ts, run.ts, generate.ts, ui.ts, bun/index.ts |
| 2025-01-13 | 3e7c41f8 | **Phase 3 Complete**: TUI resolver, .txt imports, zod-openapi fix, dev mode working |
| 2025-01-13 | ff8f4cb8 | **Phase 4 Started**: Build script created, zod-openapi centralized, esbuild working (needs import resolution fix) |
| 2025-01-13 | 126f8ba7 | **Phase 4 Complete**: Switched to tsx-based build (no bundling), I-001 resolved |
| 2025-01-13 | 126f8ba7 | **Phase 6 Started**: vitest migration, $.escape()/.raw() compat, 42/46 tests pass |
| 2025-01-13 | f5bc3052 | **Phase 7 Complete**: Removed bunfig.toml, marked publish.ts as unmaintained, verified build/tests |
| 2025-01-13 | f5bc3052 | **Phase 8 Started**: Fixed ResolveMessage error, found Server.address() issue |
| 2025-01-13 | ec8d4131 | **Typecheck Investigation**: 189→126 errors. Fixed ESNext lib, fixed zod-openapi augmentation (GPT5 consult) |

---

## Phase Completion

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation Setup | 🟢 Complete | 100% |
| Phase 2: API Replacements | 🟢 Complete | 100% |
| Phase 3: TUI Integration | 🟢 Complete | 100% |
| Phase 4: Build System | 🟢 Complete | 100% |
| Phase 5: Publishing | ⏭️ Skipped | N/A |
| Phase 6: Testing | 🟢 Complete | 100% |
| Phase 7: Cleanup | 🟢 Complete | 100% |
| Phase 8: E2E Testing | 🟡 In Progress | 20% |

---

## Detailed Task Tracking

### Phase 1: Foundation Setup ✅

- [x] 1.1 Package Manager Migration
  - [x] Create `pnpm-workspace.yaml`
  - [x] Fresh lockfile (bun.lock → pnpm-lock.yaml via `pnpm install`)
  - [x] Replace catalog references with pinned versions
  - [x] Update all package.json files
  - [x] Verify workspace linking

- [x] 1.2 Add New Dependencies
  - [x] Runtime deps: execa, glob, minimatch, which, @hono/node-server, env-paths
  - [x] Dev deps: tsx (root), esbuild, concurrently

- [x] 1.3 Update TypeScript Config
  - [x] Verify "type": "module"
  - [x] Update tsconfig (Bundler moduleResolution for tsx/esbuild)
  - [x] Removed @tsconfig/bun and @types/bun
  - [x] tsc reports 114 Bun API errors (expected, Phase 2 will fix)

- [x] 1.4 Update Dev Scripts
  - [x] `pnpm dev` uses tsx
  - [ ] Build script (Phase 4)
  - [x] Dev workflow ready (fails on Bun imports as expected)

### Phase 2: API Replacements

**Compatibility Layer: ✅ COMPLETE**
- [x] compat/file.ts - File operations (Bun.file, Bun.write)
- [x] compat/spawn.ts - Process spawning (Bun.spawn)
- [x] compat/shell.ts - Shell template ($ from "bun")
- [x] compat/which.ts - Executable lookup (Bun.which)
- [x] compat/glob.ts - Glob patterns (Bun.Glob)
- [x] compat/stream.ts - Stream utilities (readableStreamToText)
- [x] compat/resolve.ts - Module resolution (Bun.resolve)
- [x] compat/url.ts - URL utilities (Bun.fileURLToPath)
- [x] compat/index.ts - Re-exports all modules

**File Migrations (33 total):**

| File | Status | Notes |
|------|--------|-------|
| src/tool/bash.ts | 🟢 | spawn → compat |
| src/tool/edit.ts | 🟢 | file, write → compat + fs/promises stat |
| src/tool/write.ts | 🟢 | file, write → compat |
| src/tool/read.ts | 🟢 | file → compat |
| src/tool/grep.ts | 🟢 | spawn → compat, stat → fs/promises |
| src/tool/glob.ts | 🟢 | stat → fs/promises |
| src/tool/ls.ts | 🟢 | Glob, minimatch → compat |
| src/file/ripgrep.ts | 🟢 | $, which, file, write, spawn → compat |
| src/file/fzf.ts | 🟢 | which, file, write, spawn → compat |
| src/file/index.ts | 🟢 | $, file → compat |
| src/file/time.ts | 🟢 | stat → fs/promises |
| src/session/index.ts | 🟢 | file → compat |
| src/session/system.ts | 🟢 | file → compat |
| src/auth/copilot.ts | 🟢 | file, write → compat |
| src/auth/index.ts | 🟢 | file, write → compat |
| src/config/config.ts | 🟢 | file, write → compat |
| src/config/hooks.ts | 🟢 | spawn → compat |
| src/util/log.ts | 🟢 | file → createWriteStream |
| src/util/filesystem.ts | 🟢 | Glob → compat |
| src/storage/storage.ts | 🟢 | file, write, Glob → compat |
| src/global/index.ts | 🟢 | file, write → compat |
| src/app/app.ts | 🟢 | file, write → compat |
| src/provider/models.ts | 🟢 | file, write → compat |
| src/server/server.ts | 🟢 | Bun.serve → @hono/node-server |
| src/bun/index.ts | 🟢 | spawn, file → compat, npm instead of bun CLI |
| src/cli/cmd/tui.ts | 🟢 | spawn, fileURLToPath → compat; embeddedFiles block → Phase 3 TODO |
| src/cli/cmd/run.ts | 🟢 | Bun.stdin → node:stream/consumers |
| src/cli/cmd/generate.ts | 🟢 | Bun.write → fs/promises |
| src/cli/ui.ts | 🟢 | Bun.stderr.write → process.stderr.write, Bun.color → Style.TEXT_DIM |
| src/lsp/server.ts | 🟢 | $, which, spawn, file, resolve → compat |
| src/lsp/client.ts | 🟢 | file → compat |
| src/format/formatter.ts | 🟢 | which, file → compat |
| src/format/index.ts | 🟢 | spawn → compat |
| src/installation/index.ts | 🟢 | $ → compat |
| src/snapshot/index.ts | 🟢 | $ → compat |

Legend: 🔴 Not Started | 🟡 In Progress | 🟢 Complete

### Phase 3: TUI Integration ✅

- [x] ~~Decide on approach~~ → **Local resolution** (dev mode uses `go run`, prod looks for built binary)
- [x] Implement TUI resolver (`src/tui/index.ts`) — resolves binary from multiple locations
- [x] Replace Bun's `.txt` imports with `loadText()` helper (`src/compat/text.ts`)
- [x] Fix zod-openapi extension loading (explicit `extendZodWithOpenApi()` call)
- [x] Fix `exists` import (use compat instead of fs/promises)
- [x] Test dev mode execution — `pnpm dev` works with TUI via `go run`

### Phase 4: Build System (Linux Only) ✅

- [x] ~~esbuild config for bundling~~ → Switched to tsx-based approach (no bundling needed)
- [x] Build script (`packages/opencode/script/build.ts`) — builds TUI + creates launcher
- [x] ~~Centralized zod export~~ → Not needed without bundling
- [x] Go TUI build integrated into build script
- [x] **RESOLVED**: ESM import resolution — avoided by using tsx instead of bundling
- ~~SEA config~~ (skipped — using download approach)
- ~~Cross-platform matrix~~ (skipped — Linux only)

### Phase 5: Publishing — SKIPPED

> **Not needed** — local deployment only, no npm/GitHub/Homebrew/AUR

### Phase 6: Testing (Linux Only)

- [x] Migrate tests from `bun:test` to `vitest`
- [x] Add `$.escape()` and `$.raw()` to compat/shell.ts
- [x] Fix test patterns for ripgrep compatibility
- [x] Unit tests: 42/46 passing (4 pre-existing failures, see I-002)
- [x] Integration tests (manual verification: dev, build, help)
- ~~Platform testing~~ (Linux x64 only)

### Phase 7: Cleanup ✅

- [x] Remove Bun types — Already removed in Phase 1
- [x] Remove bunfig.toml — Deleted
- [x] Mark publish.ts as unmaintained (out of scope)
- [x] Final review — All verified, no active Bun code in src/

### Phase 8: E2E Testing (Runtime Verification)

- [x] Fixed ResolveMessage error (Bun-specific type in index.ts)
- [x] Fixed TUI resolution order (OPENCODE_TUI_PATH priority)
- [ ] Fix Server.address() returning null (see I-003)
- [ ] Verify TUI launches correctly with built binary
- [ ] Test full app flow: CLI → Server → TUI communication
- [ ] Test `pnpm dev` flow with `go run`
- [ ] Test `./dist/opencode` flow with built TUI

---

## Blockers, Issues and Concerns

| Issue | Status | Resolution |
|-------|--------|------------|
| None yet | - | - |

---


### What's Done

All Bun API usages have been replaced:
- `Bun.file()`, `Bun.write()` → compat/file.ts + fs/promises
- `Bun.spawn()` → compat/spawn.ts (execa)
- `Bun.Glob` → compat/glob.ts
- `Bun.which()` → compat/which.ts
- `Bun.serve()` → @hono/node-server
- `$ from "bun"` → compat/shell.ts (execa.$)
- `Bun.stdin.text()` → node:stream/consumers
- `Bun.stderr.write` → process.stderr.write
- `Bun.color()` → ANSI escape codes
- `Bun.embeddedFiles` → src/tui/index.ts resolver (dev: go run, prod: binary lookup)
- `.txt` imports → compat/text.ts `loadText()` helper
- Bun macro imports → regular imports (models-macro.ts)

### Key Decisions Made
- Using `tsx` for development AND production (no bundling)
- ~~Using `esbuild` for production bundling~~ → **Changed**: tsx for both dev and prod
- **TUI: Binary in dist/** (built by `pnpm build`)
- Using `pnpm` as package manager
- **Linux only** — no cross-platform concerns
- **Local deployment only** — no publishing
- **NO-BUN markers** — keep original Bun code as comments when replacing
- **Bundler moduleResolution** — allows extension-less imports (works with tsx)

---

## Quick Reference: API Mappings

| Bun API | Node.js Replacement |
|---------|---------------------|
| `Bun.file()` | `fs/promises` + helper |
| `Bun.write()` | `fs/promises.writeFile()` |
| `Bun.spawn()` | `execa` |
| `Bun.Glob` | `glob` + `minimatch` |
| `Bun.which()` | `which` package |
| `Bun.serve()` | `@hono/node-server` |
| `$ from "bun"` | `execa.$` |
| `readableStreamToText` | `node:stream/consumers` |
| `Bun.resolve()` | `createRequire().resolve()` |
| `Bun.fileURLToPath()` | `url.fileURLToPath()` |
| `Bun.embeddedFiles` | TUI resolver (dev: go run, prod: binary) |
| `.txt` imports | `loadText()` from compat/text.ts |
| Bun macros | Regular function calls |
