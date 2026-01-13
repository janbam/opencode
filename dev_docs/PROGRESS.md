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
| 2025-01-13 | 7d0f9a46 | **Phase 1 Complete**: pnpm workspace, deps, tsconfig |

---

## Phase Completion

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation Setup | 🟢 Complete | 100% |
| Phase 2: API Replacements | 🔴 Not Started | 0% |
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

**Compatibility Layer:**
- [ ] compat/file.ts
- [ ] compat/spawn.ts
- [ ] compat/glob.ts
- [ ] compat/which.ts
- [ ] compat/shell.ts
- [ ] compat/stream.ts
- [ ] compat/resolve.ts
- [ ] compat/url.ts

**File Migrations (33 total):**

| File | Status | Notes |
|------|--------|-------|
| src/tool/bash.ts | 🔴 | spawn |
| src/tool/edit.ts | 🔴 | file, write |
| src/tool/write.ts | 🔴 | file, write |
| src/tool/read.ts | 🔴 | file |
| src/tool/grep.ts | 🔴 | spawn, file |
| src/tool/glob.ts | 🔴 | file |
| src/tool/ls.ts | 🔴 | Glob |
| src/server/server.ts | 🔴 | serve |
| src/session/index.ts | 🔴 | file |
| src/session/system.ts | 🔴 | file |
| src/bun/index.ts | 🔴 | spawn, file, write |
| src/cli/cmd/tui.ts | 🔴 | **CRITICAL** - embeddedFiles |
| src/cli/cmd/run.ts | 🔴 | spawn |
| src/cli/cmd/generate.ts | 🔴 | TBD |
| src/cli/ui.ts | 🔴 | TBD |
| src/lsp/server.ts | 🔴 | $, which, spawn, file |
| src/lsp/client.ts | 🔴 | file |
| src/file/ripgrep.ts | 🔴 | $ |
| src/file/fzf.ts | 🔴 | which, file |
| src/file/index.ts | 🔴 | $, file |
| src/file/time.ts | 🔴 | file |
| src/format/formatter.ts | 🔴 | which |
| src/format/index.ts | 🔴 | spawn |
| src/app/app.ts | 🔴 | file, write |
| src/auth/copilot.ts | 🔴 | file |
| src/auth/index.ts | 🔴 | file |
| src/config/config.ts | 🔴 | file |
| src/config/hooks.ts | 🔴 | TBD |
| src/global/index.ts | 🔴 | file |
| src/installation/index.ts | 🔴 | $ |
| src/snapshot/index.ts | 🔴 | $ |
| src/storage/storage.ts | 🔴 | file |
| src/provider/models.ts | 🔴 | file, write |
| src/util/log.ts | 🔴 | file |
| src/util/filesystem.ts | 🔴 | file |

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

## Blockers & Issues

| Issue | Status | Resolution |
|-------|--------|------------|
| None yet | - | - |

---

## Notes for Next Session

### Where to Start
1. Begin with **Phase 2: API Replacements**
2. Create the `src/compat/` compatibility layer first
3. Start with `compat/file.ts` (most common API)
4. Then migrate files one by one using the compat layer

### Recommended Order for Phase 2
1. `src/compat/file.ts` - File operations (Bun.file, Bun.write)
2. `src/compat/spawn.ts` - Process spawning
3. `src/compat/shell.ts` - Shell template ($)
4. `src/compat/which.ts` - Executable lookup
5. `src/compat/glob.ts` - Glob patterns
6. Then migrate source files using these helpers

### Key Decisions Made
- Using `tsx` for development
- Using `esbuild` for production bundling
- **TUI: Download on first run** (NOT embedded via SEA)
- Using `pnpm` as package manager
- **Linux only** — no cross-platform concerns
- **Local deployment only** — no publishing
- **NO-BUN markers** — keep original Bun code as comments when replacing
- **Bundler moduleResolution** — allows extension-less imports (works with tsx/esbuild)

### Files Modified This Session (7d0f9a46)
- `pnpm-workspace.yaml` - Created
- `package.json` - Updated for pnpm
- `packages/opencode/package.json` - Added deps, removed Bun types
- `packages/function/package.json` - Replaced catalog refs
- `packages/web/package.json` - Replaced catalog refs
- `tsconfig.json` - Updated for Node.js
- `packages/opencode/tsconfig.json` - Bundler mode

### Reference Commands
```bash
# Check current branch
git branch --show-current  # should be: no-bun

# View Bun API usages
grep -rn "Bun\." --include="*.ts" packages/opencode/src/ | wc -l  # 114 usages

# Files using Bun
grep -rn "Bun\." --include="*.ts" packages/opencode/src/ | cut -d: -f1 | sort -u | wc -l  # 33 files
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
