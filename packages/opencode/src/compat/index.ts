/**
 * NO-BUN: Compatibility layer for Bun → Node.js migration
 *
 * This module provides drop-in replacements for Bun-specific APIs.
 * Import from here instead of "bun" to get Node.js-compatible implementations.
 *
 * @example
 * // Instead of:
 * import { $ } from "bun"
 * const file = Bun.file(path)
 *
 * // Use:
 * import { $, file } from "../compat"
 */

// File operations (Bun.file, Bun.write)
export { file, write, exists, readText, type FileHandle } from "./file"

// Process spawning (Bun.spawn)
export { spawn, exec, type SpawnOptions, type SpawnResult, type StdioOption } from "./spawn"

// Shell template tag ($ from "bun")
export { $, type ShellCommand, type ShellResult } from "./shell"

// Executable lookup (Bun.which)
export { which, whichSync } from "./which"

// Glob patterns (Bun.Glob)
export { Glob, match, scan, minimatch } from "./glob"

// Stream utilities (readableStreamToText)
export { readableStreamToText, readableStreamToBuffer } from "./stream"

// URL utilities (Bun.fileURLToPath)
export { fileURLToPath, pathToFileURL } from "./url"

// Module resolution (Bun.resolve)
export { resolve, resolveSync } from "./resolve"

// Text file loading (Bun's .txt import support)
export { loadText } from "./text"
