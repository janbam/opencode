# Bun Polyfill Migration Strategy

> **Source:** GPT-5 consultation (Session 461daa06, 2026-01-14)
> **Status:** Recommended approach for upstream sync

## Overview

Instead of editing every upstream file to replace Bun imports, we **inject a polyfill** that makes our Node.js implementations available as `globalThis.Bun` and as the `"bun"` module. This keeps upstream code unchanged and makes future syncs trivial.

---

## Why This Approach Wins

From GPT-5:

> "Your compat layer already covers ~95% of Bun APIs and the remaining 5 are trivial. That's exactly what a global polyfill excels at."
>
> "Starting from upstream HEAD avoids 5,731 commits of conflict resolution and preserves future mergeability."
>
> "A polyfill keeps almost all upstream files unchanged, minimizing patch footprint and making future upstream pulls low-risk."
>
> "You still retain your work: your compat functions get reused almost verbatim; you just expose them as a Bun global and optional 'bun' module shim."

### Comparison

| Approach | Files Changed | Future Upstream Sync |
|----------|---------------|---------------------|
| File-by-file migration | 309+ files | Nightmare (conflicts everywhere) |
| **Polyfill** | ~5-10 files | Easy (upstream unchanged) |

---

## High-Level Steps

From GPT-5:

> **Goal:** Keep upstream source as-is, inject a Node polyfill that provides `globalThis.Bun` and a `"bun"` module, and do minimal entrypoint/package changes.

1. Branch off upstream HEAD (v1.1.19)
2. Add your compat layer in `src/compat/` with two entry points:
   - `register.ts`: attaches a `Bun` object to `globalThis`
   - `module.ts`: exports the same API when code does `import ... from "bun"`
3. Provide a `bun.d.ts` with types for the Bun global and "bun" module so TypeScript works without modifying upstream files
4. Replace `bun-pty` with `node-pty` where used (single file)
5. Ensure Node 22+ baseline in package.json and scripts
6. Add minimal bootstrapping at the app entrypoint(s): `import './compat/register'` as the very first import, so Bun is ready before any file touches it
7. Verify the 5 new APIs: sleep, stringWidth, xxHash32, env, connect
8. Run tests/typecheck, fix behavior mismatches in the polyfill instead of editing upstream code
9. Optional: Use tsconfig paths to map `"bun"` to your `compat/module.ts` if upstream imports "bun"; otherwise they may rely on the global Bun only

---

## Implementation Details

### src/compat/register.ts

This file runs at app startup and attaches the fake `Bun` object to `globalThis`:

```typescript
// src/compat/register.ts — runs ONCE at app startup
import { file, write } from "./file"
import { spawn } from "./spawn"
import { $ } from "./shell"
import { which } from "./which"
import { Glob } from "./glob"
import { serve } from "./serve"
import { sleep } from "./sleep"
import { stringWidth } from "./string"
import { xxHash32 } from "./hash"

// Create a fake "Bun" object with all the APIs
globalThis.Bun = {
  file,
  write,
  spawn,
  which,
  Glob,
  serve,
  sleep,
  stringWidth,
  hash: { xxHash32 },
  env: process.env,
  // ... everything upstream expects
}
```

### src/compat/module.ts

This file is what `import ... from "bun"` resolves to:

```typescript
// src/compat/module.ts
export { $ } from "./shell"
export { spawn } from "./spawn"
export { file, write } from "./file"
export { Glob } from "./glob"
export { which } from "./which"
export { serve } from "./serve"
export { sleep } from "./sleep"
// ... etc
```

### src/compat/bun.d.ts

Type definitions so TypeScript doesn't complain:

```typescript
// src/compat/bun.d.ts
declare global {
  const Bun: {
    file(path: string): BunFile
    write(path: string, content: string | Buffer): Promise<void>
    spawn(cmd: string, args?: string[], options?: SpawnOptions): ChildProcess
    which(name: string): Promise<string | null>
    Glob: typeof import("./glob").Glob
    serve(options: ServeOptions): Server
    sleep(ms: number): Promise<void>
    stringWidth(str: string): number
    hash: {
      xxHash32(data: string | Buffer): number
    }
    env: NodeJS.ProcessEnv
    // ... etc
  }
}

declare module "bun" {
  export const $: typeof import("./shell").$
  export const spawn: typeof import("./spawn").spawn
  // ... etc
}

export {}
```

### Entrypoint Change (ONLY upstream edit needed)

```typescript
// src/index.ts — the ONLY change to upstream code
import "./compat/register"  // <-- Add this ONE line at the very top

// ... rest of upstream code unchanged
import yargs from "yargs"
// etc
```

### tsconfig.json Addition

```json
{
  "compilerOptions": {
    "paths": {
      "bun": ["./src/compat/module.ts"]
    },
    "typeRoots": ["./src/compat", "./node_modules/@types"]
  },
  "include": ["src/**/*", "src/compat/bun.d.ts"]
}
```

---

## Concrete Implementation Checklist

From GPT-5:

### Compat surface we already have (reuse):

- `Bun.file/write` → fs/promises
- `Bun.spawn/$` → execa/execa.$
- `Bun.which` → which
- `Bun.Glob` → glob + minimatch
- `Bun.serve` → @hono/node-server
- Plus the "10 more patterns" from our existing compat layer

### New upstream additions:

- `Bun.sleep` → `import { setTimeout as sleep } from 'timers/promises'`
- `Bun.stringWidth` → `string-width` package
- `Bun.hash.xxHash32` → `xxhash-wasm` (or node:crypto if acceptable)
- `Bun.env.VAR` → `process.env.VAR`
- `Bun.connect` → `net.connect` (wrap with a Promise and emulate options/events as needed)

### Other shims often needed:

- `bun-pty` → `node-pty`
- `import "bun"` module shim: export the same API you put on `globalThis.Bun`
- Types: create `src/compat/bun.d.ts` and include it in tsconfig "types" or via "typeRoots"

### Minimal project changes:

From GPT-5:

> **package.json:**
> - `"type": "module"`
> - `"engines": { "node": ">=22" }`
> - scripts use node/tsx instead of bun
> - dependencies: execa, which, glob, minimatch, @hono/node-server (if used), node-pty, string-width, xxhash-wasm
>
> **Entry file(s):** `import './compat/register'` at top
>
> **tsconfig:**
> - ensure DOM/ES libs as needed for fetch/streams
> - include `src/compat/bun.d.ts`
> - optional: `paths { "bun": ["src/compat/module.ts"] }`

### Quality gates:

From GPT-5:

> - `rg -n '(Bun\\.|from \"bun\")' ` to inventory usage and confirm polyfill coverage
> - unit/integration tests
> - a tiny compat test suite for tricky Bun semantics (Glob edge cases, spawn/$ differences, server lifecycle, connect timeouts)

---

## Multi-Session Execution Plan

From GPT-5 (adapted for ~140k token Claude Code sessions):

### Session 1: Base and Inventory (2-4h)

- Update local repo; create branch from upstream HEAD
- Scan for Bun usages; categorize by API
- Bring in `src/compat/` from your no-bun branch
- Add `bun.d.ts`, `register.ts`, `module.ts` skeletons
- Wire package.json and entrypoints

### Session 2: Core Polyfill and Boot (half-day)

- Implement/register `Bun.file/write/spawn/$/which/Glob/serve`
- Add `bun-pty` → `node-pty` replacement and any import fix
- Make the app start with Node 22; smoke test basic commands

### Session 3: New Upstream APIs and Long Tail (half-day)

- Implement sleep, stringWidth, xxHash32, env, connect
- Address any upstream-specific options/edge cases you see in codebase

### Session 4: Test Pass + Polish (half-day)

- Run full test suite; fix polyfill behavior gaps rather than editing upstream files
- Add targeted compat tests for the highest-risk shims
- Document `dev_docs/compat` for future maintainers

### Session 5: History Hygiene and Future-Proofing (2-3h)

- Optional: `git merge -s ours no-bun` to link old branch history without changing content
- Enable `git rerere` and document "how to rebase to new upstream releases"
- Keep patchset small (ideally <20 files changed)

---

## Strategic Principles

From GPT-5:

> "**Keep the delta tiny.** The less you change in upstream files, the easier life will be with future upstream updates."
>
> "**Tests are your contract.** When behavior diverges (e.g., Bun.Glob quirks), encode the expected behavior in compat tests and match that in your shim."
>
> "**Performance:** execa vs Bun.spawn and glob vs Bun.Glob can differ. If benchmarks matter for hotspots, optimize those paths after you're green."
>
> "**Types:** Type compatibility matters for dev UX. Invest 1-2 hours to produce a decent `bun.d.ts` so IDEs stay pleasant."

---

## Optional: Quick Merge Probe First

From GPT-5:

> Before committing to the polyfill approach, run a quick merge probe (max 60-90 minutes, discard if bad):
>
> ```bash
> # Fresh clone or throwaway branch:
> git fetch upstream
> git checkout -b test-merge no-bun
> git merge --no-commit --no-ff upstream/dev
>
> # Count conflicts:
> git diff --name-only --diff-filter=U | wc -l
> ```
>
> If conflicted files < ~40 and conflicts look mechanical (mostly Bun->Node substitutions), you can consider a rebase/merge. Otherwise abort and proceed with the polyfill plan.
>
> Even if the probe is "not awful," the polyfill path likely still wins on speed and on future maintenance.

---

## Summary

The polyfill approach:

1. **Preserves our work** — compat layer becomes the polyfill
2. **Keeps upstream unchanged** — minimal diff, easy future syncs
3. **Predictable effort** — no unknown merge conflict time
4. **Future-proof** — small patchset survives upstream churn

> "This reuses 95% of your prior work, avoids conflict hell, and leaves you with a small, stable patchset that will survive future upstream churn."
