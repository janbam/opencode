# opencode: Bun → Node.js Migration (Polyfill Approach)

**Goal:** Run opencode on Node.js 22+ instead of Bun

## Directory Setup

| Directory | Branch | Purpose |
|-----------|--------|---------|
| `/home/jan/src/opencode` | `no-bun-v2` | **Active work** — current upstream + polyfill |
| `/home/jan/src/opencode_old_migration` | `no-bun` | **Reference** — legacy file-by-file migration |

The old migration has working compat layer code to learn from. This project builds the polyfill on fresh upstream.

## Scope Constraints

1. **Linux only** — No Windows, no macOS
2. **Local deployment only** — No npm publishing
3. **Minimal upstream changes** — Polyfill keeps diff small (~10 files)

---

## How to Build the Polyfill

### Step 1: Understand the Patterns

Read from the old migration (`/home/jan/src/opencode_old_migration`):

```
packages/opencode/src/compat/    # Working Node.js implementations
dev_docs/bun-api-replacements.md # API mapping examples
dev_docs/archived/               # Original migration docs
```

These show exactly how each Bun API was replaced with Node.js equivalents.

### Step 2: Set Up TypeScript & Dependencies

In THIS project:

1. Update `packages/opencode/package.json`:
   - Remove: `@types/bun`, `@tsconfig/bun`, `bun-pty`
   - Add: `execa`, `glob`, `minimatch`, `which`, `@hono/node-server`, `node-pty`, `string-width`
   - Change scripts from `bun` to `tsx`

2. Update `packages/opencode/tsconfig.json`:
   - Add paths alias: `"bun": ["./src/compat/module.ts"]`
   - Include compat type definitions

3. Run `pnpm install`

### Step 3: Create the Polyfill

Create `packages/opencode/src/compat/` with:

| File | Purpose |
|------|---------|
| `register.ts` | Attaches `Bun` to `globalThis` — import at app entry |
| `module.ts` | Exports for `import { $ } from "bun"` |
| `bun.d.ts` | Type definitions for Bun global and module |
| `file.ts` | `Bun.file()`, `Bun.write()` → fs/promises |
| `spawn.ts` | `Bun.spawn()` → execa |
| `shell.ts` | `$` template tag → execa.$ |
| `glob.ts` | `Bun.Glob` → glob + minimatch |
| `which.ts` | `Bun.which()` → which package |
| `serve.ts` | `Bun.serve()` → @hono/node-server |
| `sleep.ts` | `Bun.sleep()` → timers/promises |
| `string.ts` | `Bun.stringWidth()` → string-width |
| `hash.ts` | `Bun.hash.xxHash32()` → crypto |
| `net.ts` | `Bun.connect()` → net.Socket |

Copy implementations from `opencode_old_migration/packages/opencode/src/compat/` and adapt.

### Step 4: Wire the Entry Point

```typescript
// packages/opencode/src/index.ts — ADD AT VERY TOP
import "./compat/register"

// ... rest of upstream code unchanged
```

### Step 5: Handle bun-pty

Single file change: `packages/opencode/src/pty/index.ts`
- Replace `bun-pty` import with `node-pty`
- API is nearly identical

### Step 6: Test

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm dev -- --help
```

---

## Session Plan

| Session | Focus |
|---------|-------|
| 1 | TypeScript setup, dependencies, compat/ skeleton |
| 2 | Core polyfill: file, spawn, shell, glob, which |
| 3 | Server + remaining: serve, sleep, string, hash, net |
| 4 | bun-pty → node-pty, test pass |
| 5 | Polish, cleanup, verify full app works |

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `dev_docs/PROGRESS.md` | Session log and status |
| `dev_docs/polyfill-strategy.md` | Full strategy (GPT-5 consultation) |
| `dev_docs/upstream-bun-api-analysis.md` | All Bun APIs in current upstream |
| `dev_docs/bun-api-replacements.md` | Code examples for each API |

---

## Quick Reference

### Bun API → Node.js Mapping

| Bun API | Replacement |
|---------|-------------|
| `Bun.file()` / `Bun.write()` | fs/promises |
| `Bun.spawn()` | execa |
| `$ from "bun"` | execa.$ |
| `Bun.Glob` | glob + minimatch |
| `Bun.which()` | which package |
| `Bun.serve()` | @hono/node-server |
| `Bun.sleep()` | timers/promises |
| `Bun.stringWidth()` | string-width |
| `Bun.hash.xxHash32()` | crypto |
| `Bun.env` | process.env |
| `Bun.connect()` | net.Socket |
| `bun-pty` | node-pty |

### Upstream Stats (2026-01-14)

- **Version:** v1.1.19 (commit 73d5cacc0)
- **Source files:** 309
- **Bun API coverage:** ~95% solved in old migration
- **New APIs:** 5 (sleep, stringWidth, xxHash32, env, connect)

---

## Autonomous Mode

Work in **ultrayolo** mode:
- Don't ask for confirmation on standard tasks
- Test your changes
- Commit working increments
- Keep sessions short (<120k context)
- Consult GPT5 when stuck

```
mcp__GPT5__chat with:
- reasoning_effort: "high"
- Self-contained context (GPT5 has no project knowledge)
```
