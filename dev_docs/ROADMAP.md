# Bun to Node.js Migration Roadmap (Polyfill Approach)

> Branch: `no-bun-v2`
> Target: Node.js 22+ LTS
> Status: 🟡 Phase 3 — Core compat layer fixes needed
>
> **SCOPE: Linux only, local deployment only, no publishing**

## Overview

Migrate opencode from Bun runtime to Node.js using a **polyfill approach**. Instead of editing 309 source files, we inject a compatibility layer that provides `globalThis.Bun` and a `"bun"` module shim.

**Key insight:** Upstream code stays unchanged → future upstream syncs are trivial.

---

## Phase 1: Setup & Dependencies ✅

### 1.1 Package Configuration
- [x] Update `packages/opencode/package.json`:
  - Remove: `@types/bun`, `@tsconfig/bun`, `bun-pty`
  - Add: `execa`, `glob`, `minimatch`, `which`, `@hono/node-server`, `node-pty`, `string-width`
  - Change scripts: `bun` → `tsx`
- [x] Run `pnpm install`

### 1.2 TypeScript Configuration
- [x] Update `packages/opencode/tsconfig.json`:
  - Add paths alias: `"bun": ["./src/compat/module.ts"]`
  - Configure for Node.js 22+
- [x] Update root `tsconfig.json` (removed @tsconfig/bun)

### 1.3 Compat Layer Skeleton
- [x] Create `packages/opencode/src/compat/` directory
- [x] Create `register.ts` (attaches Bun to globalThis)
- [x] Create `module.ts` (exports for `import ... from "bun"`)
- [x] Create `index.ts` (re-exports)
- [x] Create all implementation files (file, shell, spawn, glob, which, stream, url, resolve, sleep, string, net, serve)

---

## Phase 2: Core Polyfill Implementation ✅

### 2.1 File Operations
- [x] `compat/file.ts` — `Bun.file()`, `Bun.write()` → fs/promises

### 2.2 Process Spawning
- [x] `compat/spawn.ts` — `Bun.spawn()` → execa
- [x] `compat/shell.ts` — `$` template tag → execa.$

### 2.3 Utilities
- [x] `compat/glob.ts` — `Bun.Glob` → glob + minimatch
- [x] `compat/which.ts` — `Bun.which()` → which package
- [x] `compat/stream.ts` — `readableStreamToText()` etc.
- [x] `compat/resolve.ts` — `Bun.resolve()` → createRequire
- [x] `compat/url.ts` — `Bun.fileURLToPath()` → url module

### 2.4 Wire Entry Point
- [x] Add `import "./compat/register"` to `src/index.ts` (first line)

### 2.5 Non-Core Packages (Session e6813dcf)
- [x] Git hooks: `.husky/pre-push` → `pnpm typecheck`
- [x] `bun:test` polyfill via tsconfig paths:
  - `packages/app/src/compat/bun-test.ts` → vitest
  - `packages/enterprise/src/compat/bun-test.ts` → vitest
- [x] `packages/slack/tsconfig.json` — Remove @tsconfig/bun
- [x] `packages/script/tsconfig.json` — Remove @tsconfig/bun
- [x] `packages/ui/script/tailwind.ts` — Bun.file → fs/promises
- [x] `packages/console/core/tsconfig.json` — Exclude admin scripts
- [x] `packages/desktop/tsconfig.json` — Add vite/client types
- [x] **Result: 11/12 packages pass typecheck**

---

## Phase 3: Fix Remaining Compat Layer Issues 🟡

**Current blocker:** `packages/opencode` typecheck fails with these errors:

### 3.1 Missing fs.exists polyfill
- [ ] `src/storage/storage.ts` uses `fs.exists()` which doesn't exist in Node.js
- [ ] `src/util/filesystem.ts` imports `exists` from fs/promises
- **Fix:** Add `exists` function using `fs.access()` or `fs.stat()`

### 3.2 HTMLRewriter (Bun/Cloudflare specific)
- [ ] `src/tool/webfetch.ts` uses `HTMLRewriter` class
- **Fix:** Use alternative HTML parser (cheerio, htmlparser2, or linkedom)

### 3.3 Bun namespace reference
- [ ] `src/tool/read.ts:145` references `Bun` namespace for types
- **Fix:** Add proper type definitions or use `any`

### 3.4 Import path issues
- [ ] `src/tool/bash.ts` imports with `.ts` extension
- **Fix:** Remove extension or configure bundler

### 3.5 Server & New APIs (files exist but may need fixes)
- [x] `compat/serve.ts` — `Bun.serve()` → @hono/node-server
- [x] `compat/sleep.ts` — `Bun.sleep()` → timers/promises
- [x] `compat/string.ts` — `Bun.stringWidth()` → string-width
- [x] `compat/hash.ts` — `Bun.hash.xxHash32()` → crypto
- [x] `compat/net.ts` — `Bun.connect()` → net.Socket
- [x] `Bun.env` → `process.env` wired in register.ts

---

## Phase 4: PTY & Testing

### 4.1 Replace bun-pty
- [ ] Update `src/pty/index.ts`:
  - Change `import { type IPty } from "bun-pty"` → `import { type IPty } from "node-pty"`
  - Change dynamic import accordingly

### 4.2 Test Suite
- [ ] Run `pnpm test` — fix any failures
- [ ] Run `pnpm typecheck` — fix any type errors

### 4.3 Manual Testing
- [ ] `pnpm dev -- --help` works
- [ ] `pnpm dev -- --version` works
- [ ] Basic app flow works

---

## Phase 5: Polish & Verification

### 5.1 Full App Test
- [ ] TUI launches correctly
- [ ] Server starts and accepts connections
- [ ] Basic session works (send message, get response)

### 5.2 Cleanup
- [ ] Remove `bunfig.toml`
- [ ] Remove `bun.lock` (keep pnpm-lock.yaml)
- [ ] Update any remaining Bun references in docs

### 5.3 Documentation
- [ ] Update README.md with Node.js instructions
- [ ] Document upgrade process for future upstream syncs

---

## Files to Create/Modify

### New Files (compat layer)
```
packages/opencode/src/compat/
├── register.ts    # globalThis.Bun = { ... }
├── module.ts      # export { $, spawn, file, ... }
├── bun.d.ts       # Type definitions
├── index.ts       # Re-exports
├── file.ts        # Bun.file(), Bun.write()
├── spawn.ts       # Bun.spawn()
├── shell.ts       # $ template tag
├── glob.ts        # Bun.Glob
├── which.ts       # Bun.which()
├── serve.ts       # Bun.serve()
├── stream.ts      # readableStreamToText()
├── resolve.ts     # Bun.resolve()
├── url.ts         # Bun.fileURLToPath()
├── sleep.ts       # Bun.sleep()
├── string.ts      # Bun.stringWidth()
├── hash.ts        # Bun.hash.xxHash32()
└── net.ts         # Bun.connect()
```

### Modified Files (minimal changes)
```
packages/opencode/
├── src/index.ts       # Add: import "./compat/register"
├── src/pty/index.ts   # bun-pty → node-pty
├── package.json       # Dependencies & scripts
└── tsconfig.json      # Paths alias
```

### Deleted Files
```
bunfig.toml
bun.lock
```

---

## Success Criteria

1. ✅ `pnpm install` succeeds
2. ✅ `pnpm typecheck` passes
3. ✅ `pnpm test` passes
4. ✅ `pnpm dev -- --help` works
5. ✅ TUI launches and communicates with backend
6. ✅ Upstream files unchanged (except entry point + pty)
7. ✅ Future upstream sync is easy (small diff)

---

## Reference

- `dev_docs/polyfill-strategy.md` — Full strategy from GPT-5 consultation
- `dev_docs/upstream-bun-api-analysis.md` — All Bun APIs in upstream
- `dev_docs/bun-api-replacements.md` — Code examples for each API
- `/home/jan/src/opencode_old_migration/` — Working compat implementations
