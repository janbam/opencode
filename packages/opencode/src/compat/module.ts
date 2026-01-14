/**
 * Bun module polyfill for Node.js
 *
 * This file provides exports for `import { ... } from "bun"`
 * The tsconfig paths alias maps "bun" to this file.
 */

// Re-export all Bun APIs that are imported from "bun"
export { $ } from "./shell"
export { spawn, type SpawnOptions, type Subprocess } from "./spawn"
export { file, write, type BunFile } from "./file"
export { Glob } from "./glob"
export { serve, type Server } from "./serve"
export { readableStreamToText, readableStreamToBuffer } from "./stream"
export { fileURLToPath, pathToFileURL } from "./url"
export { sleep } from "./sleep"
export { stringWidth } from "./string"
export { connect } from "./net"
export { which } from "./which"

// Type re-exports
export type { ShellCommand, ShellResult } from "./shell"
