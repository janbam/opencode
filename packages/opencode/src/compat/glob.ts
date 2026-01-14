/**
 * Bun glob polyfill for Node.js
 *
 * Replaces Bun.Glob with the 'glob' and 'minimatch' npm packages.
 */

import { Glob as NodeGlob, globSync, type GlobOptions } from "glob"
import { minimatch } from "minimatch"

export { minimatch }

export interface GlobScanOptions {
  cwd?: string
  absolute?: boolean
  dot?: boolean
  onlyFiles?: boolean
  followSymlinks?: boolean
}

/**
 * Glob pattern scanner (replaces Bun.Glob)
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

  async *[Symbol.asyncIterator](): AsyncIterableIterator<string> {
    for await (const file of this.nodeGlob) {
      yield file as string
    }
  }

  async *scan(options?: GlobScanOptions): AsyncIterableIterator<string> {
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

  scanSync(options?: GlobScanOptions): string[] {
    const mergedOptions = { ...this.options, ...options }
    return globSync(this.pattern, {
      cwd: mergedOptions.cwd,
      absolute: mergedOptions.absolute,
      dot: mergedOptions.dot,
      nodir: mergedOptions.onlyFiles,
    })
  }

  async walk(): Promise<string[]> {
    const results = await this.nodeGlob.walk()
    return results.map((r) => (typeof r === "string" ? r : r.fullpath()))
  }

  match(filepath: string): boolean {
    return minimatch(filepath, this.pattern)
  }
}

export function match(filepath: string, pattern: string): boolean {
  return minimatch(filepath, pattern)
}

export async function scan(pattern: string, options?: GlobScanOptions): Promise<string[]> {
  const glob = new Glob(pattern, options)
  return glob.walk()
}
