/**
 * NO-BUN: Executable lookup compatibility layer
 *
 * Replaces Bun.which() with the 'which' npm package.
 *
 * Usage:
 *   // Instead of: Bun.which('git')
 *   import { which } from './compat/which'
 *   const gitPath = await which('git')
 */

import whichPkg from "which"

/**
 * Find the path to an executable (replaces Bun.which())
 *
 * @param command - The command to find
 * @param options - Optional configuration
 * @returns The path to the executable, or null if not found
 *
 * @example
 * const gitPath = await which('git')
 * if (gitPath) {
 *   console.log('Git found at:', gitPath)
 * }
 *
 * // With custom PATH
 * const customPath = await which('mybin', { path: '/custom/bin:/other/bin' })
 */
export async function which(
  command: string,
  options?: {
    /** Custom PATH to search (defaults to process.env.PATH) */
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
