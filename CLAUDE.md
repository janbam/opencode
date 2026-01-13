# opencode: Bun → Node.js Migration

**Branch:** `no-bun`
**Goal:** Remove all Bun dependencies, run on Node.js 22+

## IMPORTANT Scope Constraints

1. **Linux only** — This migration targets Linux exclusively. No Windows, no macOS.
2. **Local deployment only** — Will only run on this local machine. No npm publishing, no GitHub releases, no Homebrew/AUR.
3. **Avoid unnecessary complexity** — Skip cross-platform concerns, signing, SEA embedding, etc.

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

**Default: Hand off early.** Don't stretch sessions to complete everything.

- If a task spans multiple files/locations, it's fine to hand off mid-task
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
- Reference `dev_docs/bun-api-replacements.md` for API mappings
- Reference `dev_docs/migration-architecture.md` for build/architecture decisions
- Test changes before marking complete

### End of Session
- Update `dev_docs/PROGRESS.md` with completed tasks
- Update `dev_docs/ROADMAP.md` if needed
- Commit all changes including dev_docs/

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
- Use `ultrayolo passover` when reaching context limits

## Migration Stats

- **114** Bun API usages
- **33** files to modify
- **7** phases total

## Phase Order

1. Foundation Setup (pnpm, deps)
2. API Replacements (compat layer + file migrations)
3. TUI Integration (SEA or download)
4. Build System (esbuild, cross-platform)
5. Publishing (npm, GitHub, Homebrew, AUR)
6. Testing
7. Cleanup
