/**
 * Text file loading utility
 *
 * NO-BUN: Replaces Bun's native .txt file import support
 * In Bun, you can `import text from "./file.txt"` and get the string content.
 * Node.js doesn't support this, so we use fs.readFileSync instead.
 */

import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import path from "path"

/**
 * Load a text file relative to the calling module's directory
 *
 * Usage:
 *   const DESCRIPTION = loadText("./bash.txt", import.meta.url)
 *
 * Note: This is a synchronous operation, called at module load time.
 */
export function loadText(relativePath: string, importMetaUrl: string): string {
  const callerDir = path.dirname(fileURLToPath(importMetaUrl))
  const absolutePath = path.resolve(callerDir, relativePath)
  return readFileSync(absolutePath, "utf-8")
}
