/**
 * Bun module resolution polyfill for Node.js
 *
 * Replaces Bun.resolve() with Node.js equivalents.
 */

import { createRequire } from "node:module"
import * as path from "node:path"

/**
 * Resolve a module specifier from a given directory (replaces Bun.resolve())
 */
export async function resolve(specifier: string, fromDir: string): Promise<string | undefined> {
  try {
    const requireFromDir = createRequire(path.join(fromDir, "noop.js"))
    return requireFromDir.resolve(specifier)
  } catch {
    return undefined
  }
}

/**
 * Synchronous version of resolve
 */
export function resolveSync(specifier: string, fromDir: string): string | undefined {
  try {
    const requireFromDir = createRequire(path.join(fromDir, "noop.js"))
    return requireFromDir.resolve(specifier)
  } catch {
    return undefined
  }
}
