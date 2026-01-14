/**
 * Bun module polyfill for Node.js
 *
 * This file provides exports for `import { ... } from "bun"`
 * The tsconfig paths alias maps "bun" to this file.
 */

// Re-export all Bun APIs that are imported from "bun"
export { $, ShellError } from "./shell"
export { spawn, type SpawnOptions, type Subprocess } from "./spawn"
export { file, write, type BunFile, type BunFileStat } from "./file"
export { Glob, type GlobScanOptions } from "./glob"
export { serve, type Server } from "./serve"
export { readableStreamToText, readableStreamToBuffer } from "./stream"
export { fileURLToPath, pathToFileURL } from "./url"
export { sleep } from "./sleep"
export { stringWidth } from "./string"
export { connect, type BunSocket } from "./net"
export { which } from "./which"

// Type re-exports
export type { ShellCommand, ShellResult } from "./shell"

// Re-export type declarations
export type { BunFetchRequestInit, BunShell } from "./bun.d"
