/**
 * NO-BUN: File operations compatibility layer
 *
 * Replaces Bun.file() and Bun.write() with Node.js fs/promises equivalents.
 *
 * Usage:
 *   // Instead of: const file = Bun.file(path)
 *   import { file, write } from './compat/file'
 *   const f = file(path)
 *   if (await f.exists()) { ... }
 *   const content = await f.text()
 *   await write(path, content)
 */

import { readFile, writeFile, access, stat, mkdir } from "node:fs/promises"
import { constants } from "node:fs"
import * as path from "node:path"

/**
 * File handle interface matching Bun.file() return type
 */
export interface FileHandle {
  /** The file path */
  readonly name: string

  /**
   * Check if file exists
   */
  exists(): Promise<boolean>

  /**
   * Read file content as UTF-8 text
   */
  text(): Promise<string>

  /**
   * Read file as Buffer
   */
  arrayBuffer(): Promise<ArrayBuffer>

  /**
   * Get file size in bytes (returns 0 if file doesn't exist)
   */
  size(): Promise<number>

  /**
   * Write content to file (non-standard Bun API but used in codebase)
   * Prefer using the standalone write() function instead
   */
  write(content: string | Buffer | ArrayBuffer | Uint8Array): Promise<void>
}

/**
 * Create a file handle (replaces Bun.file())
 *
 * @example
 * // Read file if it exists
 * const f = file('/path/to/file.txt')
 * if (await f.exists()) {
 *   const content = await f.text()
 * }
 */
export function file(filepath: string): FileHandle {
  return {
    name: filepath,

    async exists(): Promise<boolean> {
      try {
        await access(filepath, constants.F_OK)
        return true
      } catch {
        return false
      }
    },

    async text(): Promise<string> {
      return readFile(filepath, "utf8")
    },

    async arrayBuffer(): Promise<ArrayBuffer> {
      const buffer = await readFile(filepath)
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    },

    async size(): Promise<number> {
      try {
        const stats = await stat(filepath)
        return stats.size
      } catch {
        return 0
      }
    },

    async write(content: string | Buffer | ArrayBuffer | Uint8Array): Promise<void> {
      // Ensure parent directory exists
      await mkdir(path.dirname(filepath), { recursive: true })
      // Convert ArrayBuffer to Buffer if needed
      const data = content instanceof ArrayBuffer ? Buffer.from(content) : content
      await writeFile(filepath, data)
    },
  }
}

/**
 * Write content to a file (replaces Bun.write())
 *
 * Creates parent directories if they don't exist.
 *
 * @example
 * await write('/path/to/file.txt', 'content')
 * await write('/path/to/data.json', JSON.stringify(data))
 */
export async function write(
  filepath: string | FileHandle,
  content: string | Buffer | ArrayBuffer | Uint8Array | Response
): Promise<void> {
  // Resolve filepath from FileHandle if needed
  const targetPath = typeof filepath === "string" ? filepath : filepath.name

  // Ensure parent directory exists
  await mkdir(path.dirname(targetPath), { recursive: true })

  // Handle Response object (used in some fetch scenarios)
  if (content instanceof Response) {
    const buffer = await content.arrayBuffer()
    await writeFile(targetPath, Buffer.from(buffer))
    return
  }

  // Convert ArrayBuffer to Buffer if needed
  const data = content instanceof ArrayBuffer ? Buffer.from(content) : content
  await writeFile(targetPath, data)
}

/**
 * Check if a file exists (convenience function)
 */
export async function exists(filepath: string): Promise<boolean> {
  try {
    await access(filepath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Read file content as text (convenience function)
 */
export async function readText(filepath: string): Promise<string> {
  return readFile(filepath, "utf8")
}
