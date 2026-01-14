/**
 * Bun file operations polyfill for Node.js
 *
 * Replaces Bun.file() and Bun.write() with Node.js fs/promises equivalents.
 */

import { readFile, writeFile, access, stat as fsStat, mkdir } from "node:fs/promises"
import {
  constants,
  statSync,
  type Stats,
  createWriteStream,
  mkdirSync,
  type WriteStream,
} from "node:fs"
import * as path from "node:path"
import { lookup } from "mime-types"

/**
 * File stat interface matching Bun's file stat return
 */
export interface BunFileStat {
  size: number
  mtime: Date
  atime: Date
  ctime: Date
  birthtime: Date
  isDirectory(): boolean
  isFile(): boolean
  isSymbolicLink(): boolean
}

/**
 * File writer interface for streaming writes
 */
export interface BunFileWriter {
  write(data: string | Buffer | Uint8Array): number
  flush(): void
  end(): void
}

/**
 * File handle interface matching Bun.file() return type
 */
export interface BunFile {
  /** The file path */
  readonly name: string

  /** MIME type of the file */
  readonly type: string

  /** Check if file exists */
  exists(): Promise<boolean>

  /** Read file content as UTF-8 text */
  text(): Promise<string>

  /** Parse file as JSON */
  json(): Promise<any>

  /** Read file as ArrayBuffer */
  arrayBuffer(): Promise<ArrayBuffer>

  /** Read file as Uint8Array */
  bytes(): Promise<Uint8Array>

  /** Get file stats */
  stat(): Promise<BunFileStat>

  /** Get file size in bytes (returns 0 if file doesn't exist) */
  size: number

  /** Write content to file */
  write(content: string | Buffer | ArrayBuffer | Uint8Array): Promise<void>

  /** Get a synchronous file writer for streaming writes */
  writer(): BunFileWriter
}

// Alias for backward compatibility
export type FileHandle = BunFile

/**
 * Get MIME type from file path
 */
function getMimeType(filepath: string): string {
  const mimeType = lookup(filepath)
  return mimeType || "application/octet-stream"
}

/**
 * Create a file handle (replaces Bun.file())
 */
export function file(filepath: string): BunFile {
  let cachedSize: number | null = null
  const mimeType = getMimeType(filepath)

  return {
    name: filepath,
    type: mimeType,

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

    async bytes(): Promise<Uint8Array> {
      const buffer = await readFile(filepath)
      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    },

    async stat(): Promise<BunFileStat> {
      const stats = await fsStat(filepath)
      return {
        size: stats.size,
        mtime: stats.mtime,
        atime: stats.atime,
        ctime: stats.ctime,
        birthtime: stats.birthtime,
        isDirectory: () => stats.isDirectory(),
        isFile: () => stats.isFile(),
        isSymbolicLink: () => stats.isSymbolicLink(),
      }
    },

    get size(): number {
      // Synchronous size check (lazy loaded)
      if (cachedSize === null) {
        try {
          const stats = statSync(filepath)
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

    writer(): BunFileWriter {
      // Ensure parent directory exists synchronously
      mkdirSync(path.dirname(filepath), { recursive: true })

      const stream = createWriteStream(filepath, { flags: "a" })
      return {
        write(data: string | Buffer | Uint8Array): number {
          const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data)
          stream.write(buffer)
          return buffer.length
        },
        flush(): void {
          // Node.js WriteStream doesn't have explicit flush, but write is buffered
          // This is a no-op as data is written immediately
        },
        end(): void {
          stream.end()
        },
      }
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
