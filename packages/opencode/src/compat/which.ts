/**
 * Bun which polyfill for Node.js
 *
 * Replaces Bun.which() with the 'which' npm package.
 */

import whichPkg from "which"

/**
 * Find the path to an executable (replaces Bun.which())
 */
export async function which(
  command: string,
  options?: {
    path?: string
  }
): Promise<string | null> {
  try {
    return await whichPkg(command, {
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
