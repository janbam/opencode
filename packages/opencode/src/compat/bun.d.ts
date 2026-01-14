/**
 * Type declarations for Bun compatibility layer
 *
 * These declarations provide TypeScript support for the Bun global
 * and module that our polyfill provides.
 */

import type { BunFile, BunFileStat } from "./file"
import type { Server } from "./serve"
import type { ShellCommand, ShellResult, ShellError } from "./shell"
import type { Subprocess, SpawnOptions } from "./spawn"
import type { Glob, GlobScanOptions } from "./glob"

// Re-export types that code might use
export type { BunFile, BunFileStat, Server, ShellCommand, ShellResult, Subprocess, SpawnOptions }

/**
 * BunFetchRequestInit - extends standard RequestInit
 */
export interface BunFetchRequestInit extends RequestInit {
  /** Proxy URL to use */
  proxy?: string
  /** Verbose logging */
  verbose?: boolean
  /** Timeout in milliseconds */
  timeout?: number
  /** TLS configuration */
  tls?: {
    rejectUnauthorized?: boolean
  }
}

/**
 * BunSocket interface for TCP connections
 */
export interface BunSocket {
  readonly data: any
  readonly readyState: number
  write(data: string | ArrayBuffer | Uint8Array): number
  end(data?: string | ArrayBuffer | Uint8Array): void
  close(): void
  terminate(): void
  readonly remoteAddress: string
  catch<T>(handler: (error: Error) => T): BunSocket
}

/**
 * BunShell interface for the $ template tag
 */
export interface BunShell {
  (strings: TemplateStringsArray, ...values: unknown[]): ShellCommand
  escape(str: string): string
  raw(command: string): ShellCommand
  ShellError: typeof ShellError
  braces(pattern: string): string[]
  env(vars: Record<string, string | undefined>): BunShell
  cwd(dir: string): BunShell
  nothrow(): BunShell
  throws(shouldThrow: boolean): BunShell
}

declare global {
  /**
   * Bun global object (polyfilled for Node.js)
   */
  const Bun: {
    // File operations
    file(path: string): BunFile
    write(
      path: string | BunFile,
      content: string | ArrayBuffer | Buffer | Uint8Array | Response
    ): Promise<number>

    // Process spawning
    spawn(
      command: string | string[],
      options?: SpawnOptions
    ): Subprocess

    // Shell operations
    $: BunShell
    ShellError: typeof ShellError

    // Glob patterns
    Glob: typeof Glob

    // HTTP server (Note: returns Promise in polyfill)
    serve(options: {
      port?: number
      hostname?: string
      fetch: (request: Request) => Response | Promise<Response>
    }): Promise<Server>

    // Executable lookup
    which(command: string, options?: { path?: string }): string | null

    // Utilities
    sleep(ms: number): Promise<void>
    stringWidth(str: string): number

    // Stream utilities
    readableStreamToText(stream: ReadableStream): Promise<string>
    readableStreamToBuffer(stream: ReadableStream): Promise<Buffer>

    // TCP connections
    connect(options: {
      hostname: string
      port: number
      socket: {
        data?: any
        open?: (socket: BunSocket) => void
        close?: (socket: BunSocket) => void
        error?: (socket: BunSocket, error: Error) => void
        drain?: (socket: BunSocket) => void
      }
    }): Promise<BunSocket>

    // Environment
    env: NodeJS.ProcessEnv

    // Standard streams
    stdin: NodeJS.ReadStream & {
      text(): Promise<string>
    }
    stdout: NodeJS.WriteStream
    stderr: NodeJS.WriteStream

    // Hash functions
    hash: {
      xxHash32(data: string | Buffer): number
    }

    // ANSI colors
    color(color: string, type?: string): string | null

    // Module resolution
    resolve(specifier: string, parent?: string): string
  }

  namespace Bun {
    export type File = BunFile
    export type FileStat = BunFileStat
    export type Socket = BunSocket
    export type Shell = BunShell
  }
}

export {}
