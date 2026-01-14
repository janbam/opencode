/**
 * Bun sleep polyfill for Node.js
 *
 * Replaces Bun.sleep() with timers/promises.
 */

import { setTimeout } from "timers/promises"

/**
 * Sleep for a number of milliseconds (replaces Bun.sleep())
 */
export function sleep(ms: number): Promise<void> {
  return setTimeout(ms)
}
