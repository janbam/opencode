/**
 * Bun global polyfill registration for Node.js
 *
 * This file attaches a Bun-compatible object to globalThis.
 * Import this at the application entry point BEFORE any other imports.
 *
 * @example
 * // packages/opencode/src/index.ts
 * import "./compat/register"
 * // ... rest of app
 */

import { file, write } from "./file"
import { spawn } from "./spawn"
import { Glob } from "./glob"
import { serve } from "./serve"
import { which } from "./which"
import { sleep } from "./sleep"
import { stringWidth } from "./string"
import { connect } from "./net"
import { createHash } from "crypto"

// Create the Bun global object
const BunPolyfill = {
  // File operations
  file,
  write,

  // Process spawning
  spawn,

  // Glob patterns
  Glob,

  // HTTP server
  serve,

  // Executable lookup
  which,

  // Utilities
  sleep,
  stringWidth,

  // TCP connections
  connect,

  // Environment (direct proxy to process.env)
  env: process.env,

  // Standard streams
  stdin: process.stdin,
  stdout: process.stdout,
  stderr: process.stderr,

  // Hash functions
  hash: {
    xxHash32(data: string | Buffer): number {
      // Use MD5 as simple replacement (returns consistent 32-bit value)
      const hash = createHash("md5").update(data).digest()
      return hash.readUInt32LE(0)
    },
  },

  // ANSI color (simplified)
  color(color: string, type?: string): string | null {
    // Basic ANSI color mapping
    const colors: Record<string, string> = {
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m",
      reset: "\x1b[0m",
    }
    return colors[color] || null
  },

  // Module resolution
  resolve(specifier: string, parent?: string): string {
    const { createRequire } = require("module")
    const req = createRequire(parent || import.meta.url)
    return req.resolve(specifier)
  },
}

// Attach to globalThis
;(globalThis as any).Bun = BunPolyfill

// Type declaration for global Bun
declare global {
  const Bun: typeof BunPolyfill
}

export {}
