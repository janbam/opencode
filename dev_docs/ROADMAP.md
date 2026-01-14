# Bun to Node.js Migration Roadmap (Polyfill Approach)

> Branch: `no-bun-v2`
> Target: Node.js 22+ LTS
> Status: 🟡 Phase 1 — Setup
>
> **SCOPE: Linux only, local deployment only, no publishing**

## Overview

Migrate opencode from Bun runtime to Node.js using a **polyfill approach**. Instead of editing 309 source files, we inject a compatibility layer that provides `globalThis.Bun` and a `"bun"` module shim.

**Key insight:** Upstream code stays unchanged → future upstream syncs are trivial.

---

## Phase 1: Setup & Dependencies

### 1.1 Package Configuration
- [ ] Update `packages/opencode/package.json`:
  - Remove: `@types/bun`, `@tsconfig/bun`, `bun-pty`
  - Add: `execa`, `glob`, `minimatch`, `which`, `@hono/node-server`, `node-pty`, `string-width`, `xxhash-wasm`
  - Change scripts: `bun` → `tsx`
- [ ] Update root `package.json` scripts
- [ ] Run `pnpm install`

### 1.2 TypeScript Configuration
- [ ] Update `packages/opencode/tsconfig.json`:
  - Add paths alias: `"bun": ["./src/compat/module.ts"]`
  - Configure for Node.js 22+
- [ ] Create `src/compat/bun.d.ts` type definitions
- [ ] Verify `pnpm typecheck` setup

### 1.3 Compat Layer Skeleton
- [ ] Create `packages/opencode/src/compat/` directory
- [ ] Create `register.ts` (attaches Bun to globalThis)
- [ ] Create `module.ts` (exports for `import ... from "bun"`)
- [ ] Create `index.ts` (re-exports)

---

## Phase 2: Core Polyfill Implementation

### 2.1 File Operations
- [ ] `compat/file.ts` — `Bun.file()`, `Bun.write()` → fs/promises
  - Copy from `opencode_old_migration/packages/opencode/src/compat/file.ts`
  - Adapt as needed

### 2.2 Process Spawning
- [ ] `compat/spawn.ts` — `Bun.spawn()` → execa
- [ ] `compat/shell.ts` — `$` template tag → execa.$

### 2.3 Utilities
- [ ] `compat/glob.ts` — `Bun.Glob` → glob + minimatch
- [ ] `compat/which.ts` — `Bun.which()` → which package
- [ ] `compat/stream.ts` — `readableStreamToText()` etc.
- [ ] `compat/resolve.ts` — `Bun.resolve()` → createRequire
- [ ] `compat/url.ts` — `Bun.fileURLToPath()` → url module

### 2.4 Wire Entry Point
- [ ] Add `import "./compat/register"` to `src/index.ts` (first line)

---

## Phase 3: Server & New APIs

### 3.1 Server
- [ ] `compat/serve.ts` — `Bun.serve()` → @hono/node-server

### 3.2 New APIs (not in old migration)
- [ ] `compat/sleep.ts` — `Bun.sleep()` → timers/promises
- [ ] `compat/string.ts` — `Bun.stringWidth()` → string-width
- [ ] `compat/hash.ts` — `Bun.hash.xxHash32()` → crypto or xxhash-wasm
- [ ] `compat/net.ts` — `Bun.connect()` → net.Socket
- [ ] Wire `Bun.env` → `process.env` in register.ts

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
