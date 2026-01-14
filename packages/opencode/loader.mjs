/**
 * Custom Node.js loader for handling .txt file imports
 *
 * This allows importing .txt files as strings, similar to how Bun does it.
 */

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { register } from "node:module"

// Export resolver hook to handle .txt extensions
export async function resolve(specifier, context, nextResolve) {
  // Just pass through - we handle in load
  return nextResolve(specifier, context)
}

// Export loader hook to transform .txt files
export async function load(url, context, nextLoad) {
  // Handle .txt files
  if (url.endsWith(".txt")) {
    try {
      const filepath = fileURLToPath(url)
      const content = readFileSync(filepath, "utf8")
      return {
        format: "module",
        shortCircuit: true,
        source: `export default ${JSON.stringify(content)}`,
      }
    } catch (e) {
      // Fall through to next loader
    }
  }

  // Delegate to the next loader for all other files
  return nextLoad(url, context)
}
