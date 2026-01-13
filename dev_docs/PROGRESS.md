# Migration Progress Tracker

> Branch: `no-bun`
> Started: 2025-01-13
> Last Updated: 2025-01-13

## Current Status: 🟡 Planning Complete

### Session Log

| Date | Session ID | Work Done |
|------|------------|-----------|
| 2025-01-13 | a148fa34 | Initial investigation, GPT-5 consultation, created dev_docs |

---

## Phase Completion

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation Setup | 🔴 Not Started | 0% |
| Phase 2: API Replacements | 🔴 Not Started | 0% |
| Phase 3: TUI Integration | 🔴 Not Started | 0% |
| Phase 4: Build System | 🔴 Not Started | 0% |
| Phase 5: Publishing | 🔴 Not Started | 0% |
| Phase 6: Testing | 🔴 Not Started | 0% |
| Phase 7: Cleanup | 🔴 Not Started | 0% |

---

## Detailed Task Tracking

### Phase 1: Foundation Setup

- [ ] 1.1 Package Manager Migration
  - [ ] Create `pnpm-workspace.yaml`
  - [ ] Convert lockfile
  - [ ] Replace catalog references
  - [ ] Update package.json files
  - [ ] Verify workspace linking

- [ ] 1.2 Add New Dependencies
  - [ ] Runtime deps: execa, glob, minimatch, which, @hono/node-server, env-paths
  - [ ] Dev deps: tsx, esbuild, concurrently

- [ ] 1.3 Update TypeScript Config
  - [ ] Verify "type": "module"
  - [ ] Update tsconfig
  - [ ] Run tsc --noEmit

- [ ] 1.4 Update Dev Scripts
  - [ ] Add tsx watch script
  - [ ] Add build script
  - [ ] Test dev workflow

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

### Phase 3: TUI Integration

- [ ] Decide on approach (SEA vs Download)
- [ ] Implement chosen approach
- [ ] Test TUI extraction
- [ ] Test TUI execution
- [ ] Test backend communication

### Phase 4: Build System

- [ ] esbuild config
- [ ] SEA config (if using)
- [ ] Build script
- [ ] Cross-platform matrix

### Phase 5: Publishing

- [ ] Update publish.ts
- [ ] npm packages
- [ ] GitHub releases
- [ ] Homebrew
- [ ] AUR

### Phase 6: Testing

- [ ] Unit tests passing
- [ ] Integration tests
- [ ] Platform testing

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
1. Begin with **Phase 1: Foundation Setup**
2. Create `pnpm-workspace.yaml` first
3. Run `pnpm import` to convert bun.lock
4. Add dependencies

### Key Decisions Made
- Using `tsx` for development
- Using `esbuild` for production bundling
- Using Node SEA for single-binary (with download fallback option)
- Using `pnpm` as package manager

### Files Created This Session
- `dev_docs/bun-api-replacements.md` - API replacement guide
- `dev_docs/migration-architecture.md` - Build system guide
- `dev_docs/ROADMAP.md` - Migration roadmap
- `dev_docs/PROGRESS.md` - This file

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
