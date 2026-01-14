/**
 * Bun which polyfill for Node.js
 *
 * Replaces Bun.which() with the 'which' npm package.
 * Note: Bun.which() is synchronous, so we use the sync version.
 */

import whichPkg from "which"

/**
 * Find the path to an executable (replaces Bun.which())
 * Returns synchronously like Bun.which()
 */
export function which(
  command: string,
  options?: {
    path?: string
  }
): string | null {
  try {
    return whichPkg.sync(command, {
      nothrow: true,
      path: options?.path,
    })
  } catch {
    return null
  }
}

/**
 * Synchronous version of which
 */
export function whichSync(
  command: string,
  options?: {
    path?: string
  }
): string | null {
  try {
    return whichPkg.sync(command, {
      nothrow: true,
      path: options?.path,
    })
  } catch {
    return null
  }
}
