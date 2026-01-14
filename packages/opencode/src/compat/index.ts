/**
 * Bun compatibility layer for Node.js
 *
 * This module provides drop-in replacements for Bun-specific APIs.
 */

// File operations
export { file, write, exists, type BunFile, type FileHandle } from "./file"

// Process spawning
export { spawn, type SpawnOptions, type Subprocess } from "./spawn"

// Shell template tag
export { $, type ShellCommand, type ShellResult } from "./shell"

// Executable lookup
export { which, whichSync } from "./which"

// Glob patterns
export { Glob, match, scan, minimatch } from "./glob"

// Stream utilities
export { readableStreamToText, readableStreamToBuffer } from "./stream"

// URL utilities
export { fileURLToPath, pathToFileURL } from "./url"

// Module resolution
export { resolve, resolveSync } from "./resolve"

// Server
export { serve, type Server } from "./serve"

// Utilities
export { sleep } from "./sleep"
export { stringWidth } from "./string"
export { connect, checkPortInUse } from "./net"
