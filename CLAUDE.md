# opencode: Bun → Node.js Migration

**Branch:** `no-bun`
**Goal:** Remove all Bun dependencies, run on Node.js 22+

## IMPORTANT Scope Constraints

1. **Linux only** — This migration targets Linux exclusively. No Windows, no macOS.
2. **Local deployment only** — Will only run on this local machine. No npm publishing, no GitHub releases, no Homebrew/AUR.
3. **Avoid unnecessary complexity** — Skip cross-platform concerns, signing, SEA embedding, etc.

## TypeScript Configuration

### Two tsconfig Files

| File | Purpose |
|------|---------|
| `/tsconfig.json` | Root-level scripts, IDE defaults for non-package files |
| `/packages/opencode/tsconfig.json` | The main CLI package (what we're migrating) |

Other packages (`web`, `function`) have their own tsconfigs with different extends chains.

### Why `moduleResolution: "Bundler"` Without Bundling?

The packages/opencode tsconfig uses `moduleResolution: "Bundler"` even though we run source directly via `tsx` (no bundling). This is intentional:

**The problem:** Node.js with `moduleResolution: "NodeNext"` requires explicit file extensions in imports:
```typescript
import { foo } from "./utils.js"  // NodeNext requires .js
import { foo } from "./utils"     // ❌ Error with NodeNext
```

**The solution:** `moduleResolution: "Bundler"` allows extension-less imports:
```typescript
import { foo } from "./utils"     // ✅ Works with Bundler
```

**Why this works:** `tsx` (which we use for both dev and prod) handles module resolution itself, similar to how bundlers do. It doesn't care about extensions. The "Bundler" setting tells TypeScript to accept this pattern.

**Trade-off accepted:** We're using a moduleResolution mode named after bundlers even though we don't bundle. The name is misleading but the behavior is exactly what we need for tsx.

### Declaration Emit Disabled

Both tsconfigs have `declaration: false` because:
1. Local deployment only — no npm publishing, no consumers need `.d.ts` files
2. Avoids TS2742/TS4094 errors from pnpm's nested module paths
3. `noEmit: true` means we're only typechecking anyway

### Zod-OpenAPI Extension Pattern

**IMPORTANT:** All code using `.openapi()` must import `z` from `src/lib/z.ts`, not from `"zod"` directly.

```typescript
// ✅ Correct - ensures extension is loaded
import { z } from "../lib/z"

// ❌ Wrong - extension may not be loaded
import { z } from "zod"
```

**Why:** The `zod-openapi` library extends Zod's prototype at runtime. With `moduleResolution: "Bundler"`, vitest resolves modules before setup files run. The centralized `lib/z.ts` wrapper guarantees the extension runs before any `.openapi()` call.

**The pattern:**
- `src/lib/z.ts` — imports zod, applies extension (idempotent), re-exports
- `src/types/zod-openapi-augment.d.ts` — TypeScript type augmentation for `.openapi()`
- Files using `.openapi()` — import from `../lib/z`

## Code Convention: NO-BUN Markers

When replacing Bun API code:
```typescript
// NO-BUN: replaced Bun.file/Bun.write with fs/promises
// // const file = Bun.file(filepath);
// // if (await file.exists()) { ... }
// // await Bun.write(filepath, content);
const content = await readFile(filepath, 'utf8');
await writeFile(filepath, content);
```

**Always:**
- Add `// NO-BUN: <brief explanation>` comment before replacement
- Keep original Bun code as comments (for reference/reverting)
- New code follows immediately after

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

# 1. Verify branch
git branch --show-current  # must be: no-bun

# 2. Read current state
dev_docs/PROGRESS.md
dev_docs/ROADMAP.md
dev_docs/ISSUES.md


### During Session
- Pick the next uncompleted task from PROGRESS.md
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

## Quick Reference

| Bun API | Node.js Replacement |
|---------|---------------------|
| `Bun.file()` / `Bun.write()` | `fs/promises` |
| `Bun.spawn()` | `execa` |
| `Bun.Glob` | `glob` + `minimatch` |
| `Bun.which()` | `which` package |
| `Bun.serve()` | `@hono/node-server` |
| `$ from "bun"` | `execa.$` |
| `Bun.embeddedFiles` | Download TUI on first run (no SEA) |

## Key Files

- `dev_docs/PROGRESS.md` — Task tracker (update every session)
- `dev_docs/ROADMAP.md` — Full migration plan
- `dev_docs/ISSUES.md` — **Update immediately when issues arise**
- `dev_docs/bun-api-replacements.md` — Code examples for each API
- `dev_docs/migration-architecture.md` — Build system, SEA, pnpm

## Autonomous Mode

You are running in **ultrayolo** mode. Work autonomously:
- Don't ask for confirmation on standard migration tasks
- Test your changes
- Commit working increments
- Use `ultrayolo msg` for fresh turns on complex phases
- Use `ultrayolo passover` early to start a fresh session to continue your work
- A SHORT session (<120k context) is ALWAYS BETTER than a long session!!!
- You DON'T need to complete all of your TodoWrite items in your session, the next instance will pick up automatically!

## Proactively Consult GPT5

**GPT5 is your pair programmer.** Consult GPT5 **early and often**!

**When to consult:**
- **Before implementing** — GPT5 may know a simpler approach
- **When making decisions** — get a second opinion on trade-offs
- **When debugging** — share error messages, get fresh perspectives
- **For TypeScript, Node.js, or library questions** — GPT5 has current knowledge
- **Anytime you'd benefit from a second brain** — no threshold required

**How to consult:**
```
mcp__GPT5__chat with:
- web_search: true (for current docs/issues)
- reasoning_effort: "high" (for complex problems)
- Self-contained context (GPT5 has no project knowledge)
```

**Lesson learned (Session ec8d4131):** We spent significant time debugging a zod-openapi type issue. GPT5 immediately identified the root cause (`moduleResolution: Bundler` + subpath exports) and provided the fix. Consulting earlier would have saved context.

Pair programming accelerates everything.

