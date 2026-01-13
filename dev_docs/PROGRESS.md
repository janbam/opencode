# Migration Progress Tracker

> Branch: `no-bun`
> Started: 2025-01-13
> Last Updated: 2025-01-13
>
> **SCOPE: Linux only, local deployment only, no publishing**

## Current Status: 🟢 Phase 1 Complete

### Session Log

| Date | Session ID | Work Done |
|------|------------|-----------|
| 2025-01-13 | a148fa34 | Initial investigation, GPT-5 consultation, created dev_docs |
| 2025-01-13 | 7d0f9a46 | **Phase 1 Complete** + **Compat Layer Complete**: pnpm, deps, tsconfig, src/compat/* |
| 2025-01-13 | 8bae2780 | **All tool files migrated** + **All file/* migrated**: 11 files total |
| 2025-01-13 | aff02b35 | **All easy file migrations**: session, auth, config, util, storage, global, app, provider: 12 files |
| 2025-01-13 | c3737d80 | **Medium files migrated**: format/*, lsp/*, installation, snapshot: 6 files |

---

## Phase Completion

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation Setup | 🟢 Complete | 100% |
| Phase 2: API Replacements | 🟡 In Progress | 91% |
| Phase 3: TUI Integration | 🔴 Not Started | 0% |
| Phase 4: Build System | 🔴 Not Started | 0% |
| Phase 5: Publishing | 🔴 Not Started | 0% |
| Phase 6: Testing | 🔴 Not Started | 0% |
| Phase 7: Cleanup | 🔴 Not Started | 0% |

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
| src/server/server.ts | 🔴 | serve |
| src/bun/index.ts | 🔴 | spawn, file, write |
| src/cli/cmd/tui.ts | 🔴 | **CRITICAL** - embeddedFiles |
| src/cli/cmd/run.ts | 🔴 | spawn |
| src/cli/cmd/generate.ts | 🔴 | TBD |
| src/cli/ui.ts | 🔴 | TBD |
| src/lsp/server.ts | 🟢 | $, which, spawn, file, resolve → compat |
| src/lsp/client.ts | 🟢 | file → compat |
| src/format/formatter.ts | 🟢 | which, file → compat |
| src/format/index.ts | 🟢 | spawn → compat |
| src/installation/index.ts | 🟢 | $ → compat |
| src/snapshot/index.ts | 🟢 | $ → compat |

Legend: 🔴 Not Started | 🟡 In Progress | 🟢 Complete

### Phase 3: TUI Integration (Download Approach)

- [x] ~~Decide on approach~~ → **Download on first run** (decided)
- [ ] Implement TUI downloader (`src/tui/downloader.ts`)
- [ ] Test TUI download and caching
- [ ] Test TUI execution
- [ ] Test backend communication

### Phase 4: Build System (Linux Only)

- [ ] esbuild config for bundling
- [ ] Build script (`scripts/build.ts`)
- [ ] ~~SEA config~~ (skipped — using download approach)
- [ ] ~~Cross-platform matrix~~ (skipped — Linux only)

### Phase 5: Publishing — SKIPPED

> **Not needed** — local deployment only, no npm/GitHub/Homebrew/AUR

### Phase 6: Testing (Linux Only)

- [ ] Unit tests passing
- [ ] Integration tests
- [ ] ~~Platform testing~~ (Linux x64 only)

### Phase 7: Cleanup

- [ ] Remove Bun types
- [ ] Remove bunfig.toml
- [ ] Update documentation
- [ ] Final review

---

## Blockers, Issues and Concerns

| Issue | Status | Resolution |
|-------|--------|------------|
| None yet | - | - |

---

## Notes for Next Session

### Where to Start
29 of 33 files migrated (88%). 4 files remaining.

### Remaining Files (4)

1. **Complex** (critical/many APIs):
   - `src/server/server.ts` - Bun.serve → @hono/node-server
   - `src/cli/cmd/tui.ts` - **CRITICAL** - embeddedFiles, spawn (needs TUI download logic)
   - `src/cli/cmd/run.ts` - Bun.stdin
   - `src/cli/cmd/generate.ts` - Bun.write
   - `src/cli/ui.ts` - Bun.stderr.write, Bun.color
   - `src/bun/index.ts` - may be removed entirely (check dependencies first)

### Key Decisions Made
- Using `tsx` for development
- Using `esbuild` for production bundling
- **TUI: Download on first run** (NOT embedded via SEA)
- Using `pnpm` as package manager
- **Linux only** — no cross-platform concerns
- **Local deployment only** — no publishing
- **NO-BUN markers** — keep original Bun code as comments when replacing
- **Bundler moduleResolution** — allows extension-less imports (works with tsx/esbuild)

### Reference Commands
```bash
# Check current branch
git branch --show-current  # should be: no-bun

# View remaining Bun API usages (excluding comments and compat layer docs)
grep -rn "Bun\." --include="*.ts" packages/opencode/src/ | grep -v "// //" | grep -v "NO-BUN" | wc -l

# Files still using Bun
grep -rn "Bun\." --include="*.ts" packages/opencode/src/ | grep -v "// //" | grep -v "NO-BUN" | cut -d: -f1 | sort -u
```

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Bun API usages | 114 |
| Files to modify | 33 |
| New dependencies | 8 |
| Estimated effort | 25-40 hours |

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
| `Bun.embeddedFiles` | `node:sea` assets |
