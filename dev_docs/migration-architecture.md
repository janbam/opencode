# Migration Architecture: Bun to Node.js

> Initial research by GPT-5 (2025-01-13)
> **Updated: 2025-01-13** — Final decisions after implementation
> Target: Node.js 22+ LTS

## Executive Summary

| Aspect | Initial Plan | Final Decision |
|--------|--------------|----------------|
| **Dev runtime** | `tsx` | ✅ `tsx` |
| **Prod runtime** | `esbuild` bundle | ❌ Changed to `tsx` (no bundling) |
| **TUI delivery** | Download on first run | ❌ Changed to local binary lookup |
| **Bundler** | `esbuild` for CLI → CJS | ❌ Not needed (tsx runs source directly) |
| **Package manager** | `pnpm` workspaces | ✅ `pnpm` |
| **Target platform** | Linux x64 only | ✅ Linux x64 only |
| **Publishing** | None — local only | ✅ None — local only |

---

## Key Architectural Decisions

### 1. No Bundling — tsx for Both Dev and Production

**Initial plan:** Use esbuild to bundle TypeScript to a single CJS file.

**Problem encountered:** ESM import resolution issues. When bundling with `packages: "external"`, Node.js ESM resolver fails on packages like `vscode-jsonrpc/node` (expects `.js` extension).

**Final decision:** Skip bundling entirely. Use `tsx` to run TypeScript source directly in production.

**Rationale:**
- Linux-only, local deployment = no need for portable single-file distribution
- tsx handles all ESM/CJS interop automatically
- Build time: ~1 second (just compiles Go TUI)
- Eliminates entire class of bundler-related issues

**Trade-offs accepted:**
- Requires Node.js + pnpm + tsx installed on target
- Slightly slower startup vs bundled (negligible in practice)

### 2. TUI Binary Resolution (Not Download)

**Initial plan:** Download TUI binary from GitHub releases on first run.

**Problem:** Local deployment only = no need for GitHub releases infrastructure.

**Final decision:** Build TUI locally, look for it at known paths.

**Resolution order (`src/tui/index.ts`):**
1. `dist/tui` (built production binary)
2. `go run` fallback (dev mode)

**Build process:**
```bash
# Build script compiles Go TUI to dist/tui
CGO_ENABLED=0 go build -ldflags="-s -w" \
  -o dist/tui \
  ../tui/cmd/opencode/main.go
```

### 3. Launcher Script Approach

Production runs via a launcher script (`dist/opencode`):

```bash
#!/usr/bin/env bash
exec npx tsx /path/to/packages/opencode/src/index.ts "$@"
```

**Why:**
- No bundling complexity
- Source maps work (debugging)
- Hot reload possible even in "production"

---

## Build System

### Development

```bash
pnpm dev  # tsx watch ./src/index.ts
```

- Hot reload on file changes
- TUI launched via `go run` (automatic fallback)
- Full TypeScript checking via `tsc --noEmit`

### Production Build

```bash
pnpm build  # runs script/build.ts
```

**What it does:**
1. Builds Go TUI binary → `dist/tui`
2. Creates launcher script → `dist/opencode`

**What it does NOT do:**
- Bundle TypeScript (runs source directly)
- Create single executable
- Download anything

### Running Production

```bash
./dist/opencode [args]
```

Requires: Node.js 22+, pnpm, project dependencies installed.

---

## Compatibility Layer

All Bun APIs replaced via `src/compat/`:

| Module | Replaces | Implementation |
|--------|----------|----------------|
| `compat/file.ts` | `Bun.file()`, `Bun.write()` | `fs/promises` |
| `compat/spawn.ts` | `Bun.spawn()` | `execa` |
| `compat/shell.ts` | `$ from "bun"` | `execa.$` |
| `compat/glob.ts` | `Bun.Glob` | `glob` + `minimatch` |
| `compat/which.ts` | `Bun.which()` | `which` package |
| `compat/stream.ts` | `readableStreamToText` | `node:stream/consumers` |
| `compat/resolve.ts` | `Bun.resolve()` | `createRequire().resolve()` |
| `compat/url.ts` | `Bun.fileURLToPath()` | `node:url` |
| `compat/text.ts` | `.txt` imports | `fs.readFileSync` |

### Server Migration

`Bun.serve()` → `@hono/node-server`:

```typescript
// Before
// Bun.serve({ fetch: app.fetch, port })

// After
import { serve } from "@hono/node-server"
serve({ fetch: app.fetch, port })
```

---

## Dependencies Added

| Package | Purpose |
|---------|---------|
| `tsx` | TypeScript execution (dev + prod) |
| `execa` | Process spawning, shell commands |
| `glob` | Glob pattern matching |
| `minimatch` | Glob pattern testing |
| `which` | Executable path lookup |
| `@hono/node-server` | HTTP server (replaces Bun.serve) |
| `vitest` | Test runner (replaces bun:test) |

---

## What Was NOT Implemented

These were considered but rejected for this scope:

1. **Node.js SEA (Single Executable Application)** — Adds complexity, not needed for local deployment
2. **esbuild bundling** — ESM resolution issues, not worth solving for local use
3. **TUI download on first run** — No GitHub releases, local binary is simpler
4. **Cross-platform builds** — Linux only
5. **npm publishing** — Local deployment only

---

## References

- [tsx Documentation](https://tsx.is/)
- [execa Documentation](https://github.com/sindresorhus/execa)
- [@hono/node-server](https://hono.dev/getting-started/nodejs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
