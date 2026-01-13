/**
 * NO-BUN: Glob pattern matching compatibility layer
 *
 * Replaces Bun.Glob with the 'glob' and 'minimatch' npm packages.
 */

import { Glob as NodeGlob, type GlobOptions } from "glob"
import { minimatch } from "minimatch"

export { minimatch }

/**
 * Glob pattern scanner (replaces Bun.Glob)
 *
 * @example
 * const glob = new Glob('src/*.ts', { cwd: '/path/to/dir' })
 * for await (const file of glob) {
 *   console.log(file)
 * }
 */
export class Glob {
  private readonly nodeGlob: NodeGlob<GlobOptions>
  private readonly pattern: string

  constructor(pattern: string, options?: { cwd?: string; absolute?: boolean; dot?: boolean }) {
    this.pattern = pattern
    this.nodeGlob = new NodeGlob(pattern, {
      cwd: options?.cwd,
      absolute: options?.absolute,
      dot: options?.dot,
      withFileTypes: false,
    })
  }

  /**
   * Async iterator for scanning files
   */
  async *[Symbol.asyncIterator](): AsyncIterableIterator<string> {
    for await (const file of this.nodeGlob) {
      yield file as string
    }
  }

  /**
   * Scan files matching the pattern (replaces Bun.Glob.scan())
   */
  async *scan(options?: { cwd?: string }): AsyncIterableIterator<string> {
    const glob = options?.cwd ? new NodeGlob(this.pattern, { cwd: options.cwd }) : this.nodeGlob

    for await (const file of glob) {
      yield file as string
    }
  }

  /**
   * Get all matching files as array
   */
  async walk(): Promise<string[]> {
    const results = await this.nodeGlob.walk()
    return results.map((r) => (typeof r === "string" ? r : r.fullpath()))
  }

  /**
   * Check if a path matches this glob pattern (replaces Bun.Glob.match())
   */
  match(filepath: string): boolean {
    return minimatch(filepath, this.pattern)
  }
}

/**
 * Check if a path matches a glob pattern (convenience function)
 */
export function match(filepath: string, pattern: string): boolean {
  return minimatch(filepath, pattern)
}

/**
 * Scan files matching a pattern (convenience function)
 */
export async function scan(pattern: string, options?: { cwd?: string }): Promise<string[]> {
  const glob = new Glob(pattern, options)
  return glob.walk()
}
