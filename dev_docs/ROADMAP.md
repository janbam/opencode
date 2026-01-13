# Bun to Node.js Migration Roadmap

> Branch: `no-bun`
> Target: Node.js 22+ LTS
> Status: Planning Complete, Implementation Not Started

## Overview

Migrate opencode from Bun runtime to Node.js while maintaining feature parity. The codebase has **114 Bun API usages across 33 files**.

---

## Phase 1: Foundation Setup

### 1.1 Package Manager Migration
- [ ] Create `pnpm-workspace.yaml`
- [ ] Convert `bun.lock` → `pnpm-lock.yaml`
- [ ] Replace `catalog:` references with `pnpm.overrides`
- [ ] Update all `package.json` files
- [ ] Verify workspace linking works

### 1.2 Add New Dependencies
```bash
pnpm add -w execa glob minimatch which @hono/node-server env-paths
pnpm add -wD tsx esbuild concurrently
```

### 1.3 Update TypeScript Config
- [ ] Ensure `"type": "module"` in all package.json
- [ ] Update tsconfig for Node.js target
- [ ] Verify `tsc --noEmit` passes

### 1.4 Update Dev Scripts
```json
{
  "dev": "tsx watch packages/opencode/src/index.ts",
  "check": "tsc --noEmit",
  "build": "esbuild packages/opencode/src/index.ts --bundle --platform=node --format=cjs --target=node22 --outfile=dist/cli.cjs"
}
```

---

## Phase 2: API Replacements

### 2.1 Create Compatibility Layer
Create `packages/opencode/src/compat/` with Node.js implementations:

- [ ] `compat/file.ts` - File operations (Bun.file, Bun.write)
- [ ] `compat/spawn.ts` - Process spawning (Bun.spawn)
- [ ] `compat/glob.ts` - Glob patterns (Bun.Glob)
- [ ] `compat/which.ts` - Executable lookup (Bun.which)
- [ ] `compat/shell.ts` - Shell template ($)
- [ ] `compat/stream.ts` - Stream utilities
- [ ] `compat/resolve.ts` - Module resolution
- [ ] `compat/url.ts` - URL utilities

### 2.2 File-by-File Migration

**High Priority (Core functionality):**
| File | Bun APIs Used | Complexity |
|------|---------------|------------|
| `src/tool/bash.ts` | spawn | Low |
| `src/tool/edit.ts` | file, write | Low |
| `src/tool/write.ts` | file, write | Low |
| `src/tool/read.ts` | file | Low |
| `src/tool/grep.ts` | spawn, file | Low |
| `src/tool/glob.ts` | file | Low |
| `src/tool/ls.ts` | Glob | Medium |
| `src/server/server.ts` | serve | Medium |
| `src/session/index.ts` | file | Low |

**Medium Priority:**
| File | Bun APIs Used | Complexity |
|------|---------------|------------|
| `src/bun/index.ts` | spawn, file, write | Medium |
| `src/cli/cmd/tui.ts` | spawn, embeddedFiles, file, write | **High** |
| `src/lsp/server.ts` | $, which, spawn, file | Medium |
| `src/file/ripgrep.ts` | $ | Low |
| `src/file/fzf.ts` | which, file | Low |
| `src/format/formatter.ts` | which | Low |
| `src/format/index.ts` | spawn | Low |

**Lower Priority:**
| File | Bun APIs Used | Complexity |
|------|---------------|------------|
| `src/app/app.ts` | file, write | Low |
| `src/auth/copilot.ts` | file | Low |
| `src/config/config.ts` | file | Low |
| `src/global/index.ts` | file | Low |
| `src/installation/index.ts` | $ | Low |
| `src/snapshot/index.ts` | $ | Low |
| `src/storage/storage.ts` | file | Low |
| `src/provider/models.ts` | file, write | Low |
| `src/util/log.ts` | file | Low |
| `src/util/filesystem.ts` | file | Low |

### 2.3 Remove Bun Types
- [ ] Remove `@types/bun` from devDependencies
- [ ] Remove `@tsconfig/bun` from devDependencies
- [ ] Update imports to remove `from "bun"`

---

## Phase 3: TUI Integration

### Option A: Node SEA with Embedded TUI (Recommended)

- [ ] Create `sea-config.json` template
- [ ] Implement `ensureTui()` using `node:sea` API
- [ ] Update `src/cli/cmd/tui.ts` to use SEA assets
- [ ] Create build script for SEA blob generation
- [ ] Test extraction and execution on each platform

### Option B: Download TUI on First Run

- [ ] Create `src/tui/downloader.ts`
- [ ] Implement checksum verification
- [ ] Use `env-paths` for cache location
- [ ] Handle platform/arch detection
- [ ] Add progress indicator for download

---

## Phase 4: Build System

### 4.1 Development Build
- [ ] Verify `tsx watch` works correctly
- [ ] Test Go TUI spawning in dev mode
- [ ] Ensure hot reload works

### 4.2 Production Build
- [ ] Create esbuild config for CJS output
- [ ] Create SEA config per platform
- [ ] Write `scripts/build.ts` for full build pipeline
- [ ] Test SEA injection with postject

### 4.3 Cross-Platform Builds
- [ ] Set up GitHub Actions matrix
- [ ] Build Go TUI per platform
- [ ] Build Node SEA per platform
- [ ] Sign macOS binary
- [ ] Sign Windows binary

---

## Phase 5: Publishing & Distribution

### 5.1 npm Publishing
- [ ] Update `publish.ts` for Node.js build
- [ ] Create platform-specific packages
- [ ] Test npm install on each platform

### 5.2 GitHub Releases
- [ ] Generate release assets
- [ ] Update release notes script

### 5.3 Package Managers
- [ ] Update Homebrew formula
- [ ] Update AUR PKGBUILD
- [ ] Test installation via each method

---

## Phase 6: Testing & Validation

### 6.1 Unit Tests
- [ ] Update test runner (vitest or node:test)
- [ ] Run existing tests
- [ ] Fix any failures

### 6.2 Integration Tests
- [ ] Test all CLI commands
- [ ] Test TUI launch and communication
- [ ] Test MCP server functionality
- [ ] Test LSP integration

### 6.3 Platform Testing
- [ ] Linux x64
- [ ] Linux arm64
- [ ] macOS arm64
- [ ] macOS x64
- [ ] Windows x64

---

## Phase 7: Cleanup & Documentation

- [ ] Remove all Bun-specific code
- [ ] Update README.md
- [ ] Update CONTRIBUTING.md if exists
- [ ] Remove `bunfig.toml`
- [ ] Clean up unused dependencies
- [ ] Final review of all changes

---

## Files to Modify (Complete List)

### Core Source Files (33 files)
```
packages/opencode/src/
├── app/app.ts
├── auth/copilot.ts
├── auth/index.ts
├── bun/index.ts              # May be removed or repurposed
├── cli/cmd/generate.ts
├── cli/cmd/run.ts
├── cli/cmd/tui.ts            # Major changes (embeddedFiles)
├── cli/ui.ts
├── config/config.ts
├── config/hooks.ts
├── file/fzf.ts
├── file/index.ts
├── file/ripgrep.ts
├── file/time.ts
├── format/formatter.ts
├── format/index.ts
├── global/index.ts
├── lsp/client.ts
├── lsp/server.ts
├── provider/models.ts
├── server/server.ts          # Bun.serve → @hono/node-server
├── session/index.ts
├── session/system.ts
├── storage/storage.ts
├── tool/bash.ts
├── tool/edit.ts
├── tool/glob.ts
├── tool/grep.ts
├── tool/ls.ts
├── tool/read.ts
├── tool/write.ts
├── util/filesystem.ts
└── util/log.ts
```

### Config Files
```
/
├── package.json              # Remove bun, add pnpm
├── bunfig.toml               # Delete
├── pnpm-workspace.yaml       # Create
├── .npmrc                    # Create if needed
packages/opencode/
├── package.json              # Update deps, scripts
└── tsconfig.json             # Update target
```

### Build/Publish Scripts
```
packages/opencode/script/
├── publish.ts                # Major rewrite
└── schema.ts                 # Check for Bun usage
scripts/
├── stats.ts                  # Check for Bun usage
└── ...
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SEA immaturity | Medium | High | Have fallback to separate TUI download |
| Alpine incompatibility | Low | Medium | Provide tarball alternative |
| ESM/CJS issues | Medium | Medium | Use tsx in dev, esbuild for CJS bundle |
| Performance regression | Low | Low | Benchmark critical paths |
| Breaking changes | Medium | High | Comprehensive testing |

---

## Success Criteria

1. ✅ `pnpm install` succeeds
2. ✅ `pnpm dev` launches the application
3. ✅ `pnpm build` creates working binaries
4. ✅ All CLI commands work
5. ✅ TUI launches and communicates with backend
6. ✅ Tests pass
7. ✅ Works on all target platforms
8. ✅ No Bun-specific code remains
