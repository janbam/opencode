/**
 * Bun URL utilities polyfill for Node.js
 *
 * Replaces Bun.fileURLToPath with Node.js equivalents.
 */

import { fileURLToPath as nodeFileURLToPath, pathToFileURL as nodePathToFileURL } from "node:url"

/**
 * Convert a file URL to a path (replaces Bun.fileURLToPath)
 */
export function fileURLToPath(url: string | URL): string {
  return nodeFileURLToPath(url)
}

/**
 * Convert a file path to a URL
 */
export function pathToFileURL(filepath: string): URL {
  return nodePathToFileURL(filepath)
}
