/**
 * Bun file operations polyfill for Node.js
 *
 * Replaces Bun.file() and Bun.write() with Node.js fs/promises equivalents.
 */

import { readFile, writeFile, access, stat, mkdir } from "node:fs/promises"
import { constants } from "node:fs"
import * as path from "node:path"

/**
 * File handle interface matching Bun.file() return type
 */
export interface BunFile {
  /** The file path */
  readonly name: string

  /** Check if file exists */
  exists(): Promise<boolean>

  /** Read file content as UTF-8 text */
  text(): Promise<string>

  /** Parse file as JSON */
  json(): Promise<any>

  /** Read file as ArrayBuffer */
  arrayBuffer(): Promise<ArrayBuffer>

  /** Get file size in bytes (returns 0 if file doesn't exist) */
  size: number

  /** Write content to file */
  write(content: string | Buffer | ArrayBuffer | Uint8Array): Promise<void>
}

// Alias for backward compatibility
export type FileHandle = BunFile

/**
 * Create a file handle (replaces Bun.file())
 */
export function file(filepath: string): BunFile {
  let cachedSize: number | null = null

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

    async json(): Promise<any> {
      const content = await readFile(filepath, "utf8")
      return JSON.parse(content)
    },

    async arrayBuffer(): Promise<ArrayBuffer> {
      const buffer = await readFile(filepath)
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    },

    get size(): number {
      // Synchronous size check (lazy loaded)
      if (cachedSize === null) {
        try {
          const fs = require("node:fs")
          const stats = fs.statSync(filepath)
          cachedSize = stats.size
        } catch {
          cachedSize = 0
        }
      }
      return cachedSize
    },

    async write(content: string | Buffer | ArrayBuffer | Uint8Array): Promise<void> {
      await mkdir(path.dirname(filepath), { recursive: true })
      const data = content instanceof ArrayBuffer ? Buffer.from(content) : content
      await writeFile(filepath, data)
    },
  }
}

/**
 * Write content to a file (replaces Bun.write())
 */
export async function write(
  filepath: string | BunFile,
  content: string | Buffer | ArrayBuffer | Uint8Array | Response
): Promise<number> {
  const targetPath = typeof filepath === "string" ? filepath : filepath.name

  await mkdir(path.dirname(targetPath), { recursive: true })

  // Handle Response object (duck typing for cross-realm compatibility)
  const isResponseLike =
    content?.constructor?.name === "Response" &&
    typeof (content as Response).arrayBuffer === "function"

  if (isResponseLike) {
    const buffer = await (content as Response).arrayBuffer()
    await writeFile(targetPath, Buffer.from(buffer))
    return buffer.byteLength
  }

  const nonResponseContent = content as Exclude<typeof content, Response>
  const data = nonResponseContent instanceof ArrayBuffer ? Buffer.from(nonResponseContent) : nonResponseContent
  await writeFile(targetPath, data)
  return typeof data === "string" ? Buffer.byteLength(data) : data.length
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
