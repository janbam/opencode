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

## Session Workflow

### Keep Sessions Short

**Default: Pass over early.** Don't stretch sessions to complete everything.

- If a task spans multiple files/locations, it's fine to pass over mid-task
- The next Claude instance will pick up exactly where you left off
- Only extend a session if you're working on something that **must not be left open** (e.g., broken build, incomplete refactor that breaks tests)

### Decision Points

When you reach a point in the ROADMAP where a **decision needs to be made**:

1. **Dedicate the session to research** — don't rush into implementation
2. Think through options, trade-offs, implications
3. **Document your decision** in both ROADMAP.md and PROGRESS.md
4. Hand off — implementation starts next session

One decision per session is fine. Decisions deserve focused attention.

---

## Session Protocol

### Start of Session

# 1. Read current state
dev_docs/PROGRESS.md
dev_docs/ROADMAP.md
dev_docs/ISSUES.md


### During Session
- Pick the next uncompleted task from PROGRESS.md
- IMPORTANT: when you've gathered enough information and understanding consult GPT5 as your second brain before proceeding!
- Keep your TodoWrite list short! When your todos are completed and you're still under 100k context, you can add new ones
- Reference `dev_docs/bun-api-replacements.md` for API mappings
- Reference `dev_docs/migration-architecture.md` for build/architecture decisions
- Test changes before marking complete

### End of Session
- Update `dev_docs/PROGRESS.md` with completed tasks
- Update `dev_docs/ROADMAP.md` if needed
- Commit all changes including dev_docs/

IMPORTANT: Don't add additional backlogs, what has been done or what should be done next!!
Only check off what has been done. The next instance will assess themselves what should be done next!
Only use ultrayolo passover message when you have to end your session mid-task and the next instance needs critical information about open issues.

**NO** "Notes for next session" or "Next Up" in PROGRESS.md or anywhere else!

---

## How to Build the Polyfill

### Step 1: Understand the Patterns

Read from the old migration (`/home/jan/src/opencode_old_migration`).


Important files:
packages/opencode/src/compat/    # Working Node.js implementations
dev_docs/bun-api-replacements.md # API mapping examples
dev_docs/                        # Original migration docs


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

## Manual migration

IMPORTANT: When modifying code for non-bun migration that does not use the polyfill approach ALWAYS add a NO-BUN comment marker and keep the previous code commented out for reference!


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

When working in **ultrayolo** mode:
- Don't ask for confirmation on standard tasks
- Test your changes
- Commit working increments
- Keep sessions short (<120k context)

---

## MANDATORY: Consult GPT5 at Phase Start


**GPT5 is your pair programmer.** Consult GPT5 **early and often**!

**At the beginning of EACH session/phase, you MUST consult GPT5.**

GPT5 often knows simpler approaches, gotchas, or better patterns. Consulting BEFORE implementation saves context and prevents rework.

```
mcp__GPT5__chat with:
- reasoning_effort: "high"
- web_search: true (for current library docs)
- Self-contained context (GPT5 has no project knowledge)
```

**Also consult when:**
- Running into issues
- Making architectural decisions
- Unsure about Node.js/TypeScript patterns
- For finding alternative solutions
- For optimizing your solution
- For critiquing your solution before starting implementation

See `dev_docs/polyfill-strategy.md` for the full strategy that GPT5 recommended.

Pair programming with GPT accelerates and improves everything!