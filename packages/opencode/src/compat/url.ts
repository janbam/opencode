/**
 * NO-BUN: URL utilities compatibility layer
 *
 * Replaces Bun.fileURLToPath with Node.js equivalents.
 *
 * Usage:
 *   // Instead of: Bun.fileURLToPath(url)
 *   import { fileURLToPath } from './compat/url'
 */

import { fileURLToPath as nodeFileURLToPath, pathToFileURL as nodePathToFileURL } from "node:url"

/**
 * Convert a file URL to a path (replaces Bun.fileURLToPath)
 *
 * @example
 * const path = fileURLToPath(import.meta.url)
 * const path2 = fileURLToPath(new URL('file:///path/to/file.txt'))
 */
export function fileURLToPath(url: string | URL): string {
  return nodeFileURLToPath(url)
}

/**
 * Convert a file path to a URL
 *
 * @example
 * const url = pathToFileURL('/path/to/file.txt')
 */
export function pathToFileURL(filepath: string): URL {
  return nodePathToFileURL(filepath)
}
