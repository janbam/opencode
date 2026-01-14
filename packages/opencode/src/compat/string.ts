/**
 * Bun string utilities polyfill for Node.js
 *
 * Replaces Bun.stringWidth() with the 'string-width' npm package.
 */

import stringWidthPkg from "string-width"

/**
 * Get the visual width of a string (replaces Bun.stringWidth())
 *
 * Accounts for fullwidth characters, emoji, and ANSI escape codes.
 */
export function stringWidth(str: string): number {
  return stringWidthPkg(str)
}
