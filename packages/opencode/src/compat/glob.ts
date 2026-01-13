/**
 * NO-BUN: Glob pattern matching compatibility layer
 *
 * Replaces Bun.Glob with the 'glob' and 'minimatch' npm packages.
 */

import { Glob as NodeGlob, globSync, type GlobOptions } from "glob"
import { minimatch } from "minimatch"

export { minimatch }

interface GlobScanOptions {
  cwd?: string
  absolute?: boolean
  dot?: boolean
  onlyFiles?: boolean
}

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
  private readonly options: GlobScanOptions

  constructor(pattern: string, options?: GlobScanOptions) {
    this.pattern = pattern
    this.options = options ?? {}
    this.nodeGlob = new NodeGlob(pattern, {
      cwd: options?.cwd,
      absolute: options?.absolute,
      dot: options?.dot,
      nodir: options?.onlyFiles,
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
   * Preserves constructor options (like dot: true) when a new cwd is provided
   */
  async *scan(options?: GlobScanOptions): AsyncIterableIterator<string> {
    // Merge options: scan options override constructor options
    const mergedOptions = { ...this.options, ...options }
    const glob = new NodeGlob(this.pattern, {
      cwd: mergedOptions.cwd,
      absolute: mergedOptions.absolute,
      dot: mergedOptions.dot,
      nodir: mergedOptions.onlyFiles,
      withFileTypes: false,
    })

    for await (const file of glob) {
      yield file as string
    }
  }

  /**
   * Synchronous scan (replaces Bun.Glob.scanSync())
   */
  scanSync(options?: GlobScanOptions): string[] {
    // Merge options: scan options override constructor options
    const mergedOptions = { ...this.options, ...options }
    return globSync(this.pattern, {
      cwd: mergedOptions.cwd,
      absolute: mergedOptions.absolute,
      dot: mergedOptions.dot,
      nodir: mergedOptions.onlyFiles,
    })
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
export async function scan(pattern: string, options?: GlobScanOptions): Promise<string[]> {
  const glob = new Glob(pattern, options)
  return glob.walk()
}
