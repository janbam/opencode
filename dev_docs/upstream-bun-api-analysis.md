# Upstream Bun API Analysis

> **Date:** 2026-01-14
> **Upstream commit:** 73d5cacc0 (fix: add missing metadata() and ask() definitions to ToolContext type)
> **Compared against:** no-bun branch (based on July 2025 fork)

## Summary Statistics

- **Total files with Bun imports/APIs:** 60+ files
- **Total Bun API call patterns:** 18 unique types
- **Files with `from "bun"` imports:** 22 files
- **Files with `Bun.` API calls:** 55+ files
- **Source files in upstream:** 309 (vs 117 in our fork)
- **Commits behind upstream:** 5,731

---

## KNOWN APIs (Already Handled in no-bun Migration)

| API Pattern | Count | Status | Our Replacement |
|---|---|---|---|
| `Bun.file()` | 112 | ✅ KNOWN | fs/promises (readFile, etc.) via compat/file.ts |
| `Bun.which()` | 72 | ✅ KNOWN | `which` package via compat/which.ts |
| `Bun.write()` | 36 | ✅ KNOWN | fs/promises (writeFile, etc.) via compat/file.ts |
| `Bun.spawn()` | 27 | ✅ KNOWN | `execa` via compat/spawn.ts |
| `new Bun.Glob()` | 21 | ✅ KNOWN | `glob` + `minimatch` via compat/glob.ts |
| `Bun.Glob` (pattern string) | 23 | ✅ KNOWN | `glob` via compat/glob.ts |
| `Bun.serve()` | 5 | ✅ KNOWN | `@hono/node-server` |
| `Bun.resolve()` | 4 | ✅ KNOWN | `createRequire().resolve()` via compat/resolve.ts |
| `Bun.stdin` | 2 | ✅ KNOWN | `process.stdin` |
| `Bun.stderr.write()` | 2 | ✅ KNOWN | `process.stderr.write()` |
| `Bun.color()` | 1 | ✅ KNOWN | ANSI codes |
| `$ from "bun"` | 17 | ✅ KNOWN | `execa.$` via compat/shell.ts |
| `readableStreamToText()` | 4 imports | ✅ KNOWN | compat/stream.ts |
| `spawn from "bun"` | 1 | ✅ KNOWN | `execa` |
| `fileURLToPath from "bun"` | implied | ✅ KNOWN | `url.fileURLToPath()` via compat/url.ts |
| `type BunFile` | 1 type | ✅ KNOWN | Remove type (use fs native) |
| `type SystemError` | 1 type | ✅ KNOWN | Node.js Error types |

---

## NEW APIs (NOT in Existing Migration)

| API Pattern | Count | Files | Impact | Suggested Replacement |
|---|---|---|---|---|
| **`Bun.sleep(ms)`** | 8 | shell.ts, auth.ts, github.ts, debug/lsp.ts, tui/worker.ts (2x) | Medium | `setTimeout()` promisified or `timers/promises` |
| **`Bun.stringWidth(str)`** | 3 | tui/component/prompt/autocomplete.tsx (2x), prompt/index.tsx | Low | `string-width` npm package |
| **`Bun.hash.xxHash32(data)`** | 1 | provider/provider.ts:969 | Low | `xxhash-wasm` or `crypto.createHash('md5')` |
| **`Bun.env.VARIABLE`** | 1 | provider/models-macro.ts:2 | Low | `process.env.VARIABLE` |
| **`Bun.connect(options)`** | 1 | mcp/oauth-callback.ts:163 | Low | `node:net.Socket` |

---

## Files with NEW API Usage (Detailed)

### 1. `packages/opencode/src/shell/shell.ts`
- Lines: 24, 30
- API: `Bun.sleep(SIGKILL_TIMEOUT_MS)`
- Context: Timeout delays in shell process handling

### 2. `packages/opencode/src/cli/cmd/auth.ts`
- Line: 39
- API: `Bun.sleep(10)`
- Context: Brief delay during auth flow

### 3. `packages/opencode/src/cli/cmd/github.ts`
- Lines: 351, 1292
- API: `Bun.sleep(1000)` and `Bun.sleep(delayMs)`
- Context: Retry delays in GitHub API polling

### 4. `packages/opencode/src/cli/cmd/debug/lsp.ts`
- Line: 22
- API: `Bun.sleep(1000)`
- Context: Delay in LSP debug command

### 5. `packages/opencode/src/cli/cmd/tui/worker.ts`
- Lines: 78, 87
- API: `Bun.sleep(250)`
- Context: Event loop delays in TUI worker

### 6. `packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx`
- Lines: 149, 328
- API: `Bun.stringWidth(virtualText)` and `Bun.stringWidth(newText)`
- Context: Terminal string width calculation for autocomplete rendering

### 7. `packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx`
- Line: 307
- API: `Bun.stringWidth(content)`
- Context: Terminal string width for cursor offset calculation

### 8. `packages/opencode/src/provider/provider.ts`
- Line: 969
- API: `Bun.hash.xxHash32(JSON.stringify({...}))`
- Context: Creating cache key for SDK instances

### 9. `packages/opencode/src/provider/models-macro.ts`
- Line: 2
- API: `Bun.env.MODELS_DEV_API_JSON`
- Context: Reading environment variable for dev API JSON path

### 10. `packages/opencode/src/mcp/oauth-callback.ts`
- Line: 163
- API: `Bun.connect({ hostname, port, socket })`
- Context: Checking if OAuth callback port is in use

---

## Compat Layer Additions Needed

To handle the 5 new APIs, add to our compat layer:

### compat/sleep.ts
```typescript
import { setTimeout } from "timers/promises"

export const sleep = (ms: number): Promise<void> => setTimeout(ms)
```

### compat/string.ts
```typescript
import stringWidth from "string-width"

export { stringWidth }
```

### compat/hash.ts
```typescript
import { createHash } from "crypto"

export function xxHash32(data: string | Buffer): number {
  // Use MD5 as a simple replacement (or use xxhash-wasm for true xxHash)
  const hash = createHash("md5").update(data).digest()
  return hash.readUInt32LE(0)
}
```

### compat/net.ts
```typescript
import { Socket } from "net"

export function checkPortInUse(hostname: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket()
    socket.setTimeout(1000)
    socket.once("connect", () => {
      socket.destroy()
      resolve(true)
    })
    socket.once("error", () => resolve(false))
    socket.once("timeout", () => {
      socket.destroy()
      resolve(false)
    })
    socket.connect(port, hostname)
  })
}
```

### Update existing files
- `Bun.env.VAR` → `process.env.VAR` (direct replacement, no compat needed)

---

## Migration Impact Assessment

### Coverage
- **Known APIs:** ~95% of all Bun API usage
- **New APIs:** ~5% (5 patterns, 14 occurrences)

### Effort Estimate
- **Compat layer additions:** ~1 hour (simple implementations)
- **File migrations:** The real work — 192 new files since July 2025

### Risk Assessment
- **LOW:** All new APIs have straightforward Node.js equivalents
- **MEDIUM:** The volume of new code (5,731 commits, 192 new files)
- **HIGH:** Potential for merge conflicts if attempting git merge

---

## Strategic Options

### Option 1: Merge upstream/dev into no-bun
- **Pro:** Preserves git history, single merge operation
- **Con:** 5,731 commits = massive conflict resolution likely
- **Effort:** Unknown (could be hours or days)

### Option 2: Fresh migration on current upstream
- **Pro:** Clean start, apply proven patterns
- **Con:** Lose git history connection, redo all file migrations
- **Effort:** ~2-3 days (we have patterns, but 309 files)

### Option 3: Cherry-pick approach
- **Pro:** Selective, controlled
- **Con:** Very tedious for 5,731 commits
- **Effort:** Not practical

### Recommendation
Try Option 1 first (merge). If conflicts are unmanageable, fall back to Option 2.

---

## New Codebase Features (since July 2025)

Based on new imports in index.ts:
- `AcpCommand` - New command
- `WebCommand` - Web-related features
- `PrCommand` - PR workflow integration
- `SessionCommand` - Session management
- `GithubCommand` - GitHub integration
- `ExportCommand` / `ImportCommand` - Data portability
- `AttachCommand` - TUI attachment
- `TuiThreadCommand` - TUI threading
- Desktop app support (`bun-pty` for terminal)
- Plan mode features
- New providers (GitLab Duo, 302ai, etc.)

---

## Bun Dependencies in Other Packages

Not just `opencode` — other packages in the monorepo also have Bun dependencies:

| Package | Bun Deps | Impact |
|---------|----------|--------|
| **opencode** | `@types/bun`, `@tsconfig/bun`, `bun-pty` | Main target — runtime deps |
| **app** | `@types/bun`, `@tsconfig/bun` | Types/config only |
| **desktop** | `@types/bun` | Types only |
| **console/core** | `@types/bun` | Types only |
| **console/mail** | `@tsconfig/bun` | Config only |
| **util** | `@types/bun` | Types only |
| **script** | `@types/bun` | Types only |
| **ui** | `@types/bun` | Types only |

**Packages with NO Bun dependencies:**
- function
- web
- plugin
- enterprise
- slack

### Assessment

Most packages only have `@types/bun` or `@tsconfig/bun` — these are **build-time only** and easy to remove. The only package with **runtime** Bun dependencies is `opencode` (which has `bun-pty`).

---

## bun-pty Deep Dive

### What is it?

`bun-pty` is a PTY (pseudo-terminal) library that allows spawning interactive shell sessions. It's used for the **built-in terminal feature** in the IDE.

### Where is it used?

**Single file:** `packages/opencode/src/pty/index.ts`

```typescript
import { type IPty } from "bun-pty"
const { spawn } = await import("bun-pty")
```

### What it does

The `Pty` namespace provides:

| Function | Purpose |
|----------|---------|
| `create()` | Spawn a new shell process in a PTY |
| `write()` | Send input to the terminal |
| `resize()` | Change terminal dimensions (rows/columns) |
| `connect()` | Connect a WebSocket client to a PTY |
| `remove()` | Kill and cleanup a PTY session |
| `update()` | Update title or resize TTY |
| `list()` / `get()` | Query active sessions |

**Terminal capabilities:**
- Spawns shell processes with configurable command, args, cwd, environment
- Sets TERM to `xterm-256color`
- Captures stdin/stdout via `onData()` callback
- Handles process exit via `onExit()` callback
- Maintains 2MB buffer of terminal output for latecomers
- Supports WebSocket subscriptions for real-time terminal output

### Node.js Replacement

**`node-pty`** — Industry standard, direct replacement

| Aspect | node-pty |
|--------|----------|
| Status | ✅ Actively maintained |
| API | Nearly identical to bun-pty |
| Users | VS Code, iTerm2, Hyper, etc. |
| Platform | Linux, macOS, Windows |

**Migration complexity: LOW**
- Same spawn signature and callback pattern
- Single file to modify
- Well-isolated from rest of codebase

### Example Migration

```typescript
// Before (bun-pty)
import { type IPty } from "bun-pty"
const { spawn } = await import("bun-pty")
const pty = spawn(command, args, { cwd, env, rows, cols })

// After (node-pty)
import { type IPty, spawn } from "node-pty"
const pty = spawn(command, args, { cwd, env, rows, cols })
```

### How Central is bun-pty?

**Moderate-to-High centrality:**
- It's a **feature**, not infrastructure (could theoretically be disabled)
- But it's a **core IDE feature** — terminal access is critical for a development tool
- Removing it entirely would disable terminal functionality

**Migration risk: LOW** — Direct replacement exists, API is compatible.

---

## Files with `from "bun"` Imports (Full List)

Found in 30+ files across opencode package:

```
packages/opencode/src/installation/index.ts
packages/opencode/src/tool/bash.ts
packages/opencode/src/format/formatter.ts
packages/opencode/src/worktree/index.ts
packages/opencode/src/snapshot/index.ts
packages/opencode/src/lsp/server.ts
packages/opencode/src/bun/index.ts
packages/opencode/src/ide/index.ts
packages/opencode/src/session/message-v2.ts
packages/opencode/src/session/prompt.ts
packages/opencode/src/file/index.ts
packages/opencode/src/file/watcher.ts
packages/opencode/src/file/ripgrep.ts
packages/opencode/src/project/vcs.ts
packages/opencode/src/project/project.ts
packages/opencode/src/storage/storage.ts
packages/opencode/src/cli/cmd/pr.ts
packages/opencode/src/cli/cmd/uninstall.ts
packages/opencode/src/cli/cmd/github.ts
packages/opencode/src/cli/cmd/tui/util/clipboard.ts
packages/opencode/src/util/archive.ts
packages/opencode/script/build.ts
packages/opencode/script/publish.ts
+ test files
+ sdk/plugin build scripts
```

Many of these are **new files** since our July 2025 fork that would need migration.
