/**
 * NO-BUN: Module resolution compatibility layer
 *
 * Replaces Bun.resolve() with Node.js equivalents.
 *
 * Usage:
 *   // Instead of: Bun.resolve('typescript/lib/tsserver.js', cwd)
 *   import { resolve } from './compat/resolve'
 *   const path = await resolve('typescript/lib/tsserver.js', cwd)
 */

import { createRequire } from "node:module"
import * as path from "node:path"

/**
 * Resolve a module specifier from a given directory (replaces Bun.resolve())
 *
 * @param specifier - The module specifier to resolve (e.g., 'typescript/lib/tsserver.js')
 * @param fromDir - The directory to resolve from
 * @returns The resolved file path, or undefined if not found
 *
 * @example
 * const tsserver = await resolve('typescript/lib/tsserver.js', app.path.cwd)
 * if (tsserver) {
 *   console.log('Found tsserver at:', tsserver)
 * }
 */
export async function resolve(specifier: string, fromDir: string): Promise<string | undefined> {
  try {
    // Create a require function that resolves from the target directory
    // We use a fake file path to establish the resolution context
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
