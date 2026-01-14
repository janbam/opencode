# opencode: Bun → Node.js Migration (Polyfill Approach)

**Goal:** Run opencode on Node.js 22+ instead of Bun

## Current Status: Polyfill Strategy

We're using a **polyfill approach** instead of file-by-file migration. This keeps upstream code unchanged and makes future syncs trivial.

### Branches

| Branch | Location | Purpose |
|--------|----------|---------|
| `no-bun` | `/home/jan/src/opencode` | Legacy migration (July 2025 fork) — **reference only** |
| `no-bun-v2` | `/home/jan/src/opencode-polyfill` | Polyfill on current upstream — **active work** |

### Setup (Git Worktree)

```bash
cd /home/jan/src/opencode
git worktree add ../opencode-polyfill upstream/dev -b no-bun-v2
```

## The Polyfill Approach

Instead of editing every file to replace Bun imports, we inject a polyfill that makes our Node.js implementations available as `globalThis.Bun` and as the `"bun"` module.

**Key insight:** Upstream code stays unchanged → future upstream syncs are easy.

See `dev_docs/polyfill-strategy.md` for full implementation details.

### Core Files to Create

```
packages/opencode/src/compat/
├── register.ts    # Attaches Bun to globalThis (run at startup)
├── module.ts      # Exports for `import ... from "bun"`
├── bun.d.ts       # Type definitions
├── file.ts        # Bun.file(), Bun.write()
├── spawn.ts       # Bun.spawn()
├── shell.ts       # $ template tag
├── glob.ts        # Bun.Glob
├── which.ts       # Bun.which()
├── serve.ts       # Bun.serve()
├── sleep.ts       # Bun.sleep()        [NEW]
├── string.ts      # Bun.stringWidth()  [NEW]
├── hash.ts        # Bun.hash.xxHash32()[NEW]
└── net.ts         # Bun.connect()      [NEW]
```

### The One Upstream Edit

```typescript
// packages/opencode/src/index.ts — ADD THIS AT THE VERY TOP
import "./compat/register"

// ... rest of upstream code unchanged
```

## Scope Constraints

1. **Linux only** — No Windows, no macOS
2. **Local deployment only** — No npm publishing, no GitHub releases
3. **Minimal upstream changes** — Polyfill approach keeps diff small

## Key Documents

| Document | Purpose |
|----------|---------|
| `dev_docs/PROGRESS.md` | Session log and status |
| `dev_docs/polyfill-strategy.md` | Full implementation plan |
| `dev_docs/upstream-bun-api-analysis.md` | Current upstream Bun API usage |
| `dev_docs/bun-api-replacements.md` | API mapping reference (from legacy work) |

## Session Protocol

### Start of Session

```bash
# 1. Go to the polyfill worktree
cd /home/jan/src/opencode-polyfill

# 2. Read current state
cat dev_docs/PROGRESS.md
cat dev_docs/polyfill-strategy.md
```

### During Session

- Work in the polyfill worktree (`opencode-polyfill`)
- Reference the legacy `no-bun` branch for compat code patterns
- Test changes before marking complete
- Keep upstream files unchanged — fix the polyfill instead

### End of Session

- Update `dev_docs/PROGRESS.md` with completed work
- Commit to `no-bun-v2` branch
- Push if ready

## Quick Reference

### Bun API → Node.js Mapping

| Bun API | Polyfill Implementation |
|---------|------------------------|
| `Bun.file()` / `Bun.write()` | fs/promises |
| `Bun.spawn()` | execa |
| `Bun.Glob` | glob + minimatch |
| `Bun.which()` | which package |
| `Bun.serve()` | @hono/node-server |
| `$ from "bun"` | execa.$ |
| `Bun.sleep()` | timers/promises |
| `Bun.stringWidth()` | string-width package |
| `Bun.hash.xxHash32()` | xxhash-wasm or crypto |
| `Bun.env` | process.env |
| `Bun.connect()` | net.Socket |
| `bun-pty` | node-pty |

### Upstream Stats (2026-01-14)

- **Version:** v1.1.19
- **Commit:** 73d5cacc0
- **Source files:** 309
- **Bun API coverage:** ~95% already solved
- **New APIs:** 5 (sleep, stringWidth, xxHash32, env, connect)

## Autonomous Mode

You are running in **ultrayolo** mode. Work autonomously:
- Don't ask for confirmation on standard tasks
- Test your changes
- Commit working increments
- Keep sessions short (<120k context)
- Consult GPT5 when stuck or making decisions

## Proactively Consult GPT5

**GPT5 is your pair programmer.** Use it for:
- Implementation questions
- Debugging help
- Second opinions on trade-offs
- Current library/API knowledge

```
mcp__GPT5__chat with:
- reasoning_effort: "high" (for complex problems)
- Self-contained context (GPT5 has no project knowledge)
```
