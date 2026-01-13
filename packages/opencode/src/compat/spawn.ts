/**
 * NO-BUN: Process spawning compatibility layer
 *
 * Replaces Bun.spawn() with execa-based implementation.
 *
 * Usage:
 *   // Instead of: Bun.spawn({ cmd: ['git', 'status'], ... })
 *   import { spawn } from './compat/spawn'
 *   const proc = spawn({ cmd: ['git', 'status'], ... })
 *   await proc.exited
 *   const output = await proc.text()
 */

import { execa, type ResultPromise, type Options as ExecaOptions } from "execa"
import { Readable } from "node:stream"

export type StdioOption = "pipe" | "inherit" | "ignore" | null | undefined

export interface SpawnOptions {
  /** Command and arguments as array */
  cmd: string[]
  /** Working directory */
  cwd?: string
  /** Environment variables */
  env?: Record<string, string | undefined>
  /** Standard input handling */
  stdin?: StdioOption
  /** Standard output handling */
  stdout?: StdioOption
  /** Standard error handling */
  stderr?: StdioOption
  /** AbortSignal for cancellation */
  signal?: AbortSignal
  /** Timeout in milliseconds */
  timeout?: number
  /** Callback when process exits */
  onExit?: (code: number | null) => void
  /** Max buffer size (not directly supported, ignored) */
  maxBuffer?: number
}

export interface SpawnResult {
  /** Promise that resolves to exit code when process exits (matches Bun.spawn behavior) */
  readonly exited: Promise<number>
  /** Process exit code (available after exited resolves) */
  readonly exitCode: number | null
  /** Standard output stream (when stdout: 'pipe') */
  readonly stdout: ReadableStream<Uint8Array> | null
  /** Standard error stream (when stderr: 'pipe') */
  readonly stderr: ReadableStream<Uint8Array> | null
  /** Read stdout as text (convenience method) */
  text(): Promise<string>
  /** Read stderr as text (convenience method) */
  stderrText(): Promise<string>
  /** Kill the process */
  kill(signal?: NodeJS.Signals): void
}

/**
 * Convert Node.js Readable stream to Web ReadableStream
 */
function nodeStreamToWebStream(nodeStream: Readable | null): ReadableStream<Uint8Array> | null {
  if (!nodeStream) return null

  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk))
      })
      nodeStream.on("end", () => {
        controller.close()
      })
      nodeStream.on("error", (err) => {
        controller.error(err)
      })
    },
    cancel() {
      nodeStream.destroy()
    },
  })
}

/**
 * Spawn a child process (replaces Bun.spawn())
 *
 * @example
 * const proc = spawn({
 *   cmd: ['git', 'status'],
 *   cwd: '/path/to/repo',
 *   stdout: 'pipe',
 *   stderr: 'pipe',
 * })
 * await proc.exited
 * const output = await proc.text()
 */
export function spawn(options: SpawnOptions): SpawnResult {
  const [command, ...args] = options.cmd

  // Map stdio options
  const stdin = options.stdin === "inherit" ? "inherit" : options.stdin === "pipe" ? "pipe" : "ignore"
  const stdout = options.stdout === "inherit" ? "inherit" : options.stdout === "pipe" ? "pipe" : "ignore"
  const stderr = options.stderr === "inherit" ? "inherit" : options.stderr === "pipe" ? "pipe" : "ignore"

  const execaOptions: ExecaOptions = {
    cwd: options.cwd,
    env: options.env,
    stdin,
    stdout,
    stderr,
    timeout: options.timeout,
    cancelSignal: options.signal,
    reject: false, // Don't throw on non-zero exit
    buffer: true, // Buffer output for text() methods
  }

  // Start the process
  const subprocess = execa(command, args, execaOptions)

  let exitCode: number | null = null
  let stdoutText = ""
  let stderrText = ""

  // Create the exited promise - returns exit code to match Bun.spawn behavior
  const exited = subprocess.then((result): number => {
    exitCode = result.exitCode ?? null
    stdoutText = String(result.stdout ?? "")
    stderrText = String(result.stderr ?? "")

    // Call onExit callback if provided
    if (options.onExit) {
      options.onExit(exitCode)
    }

    return exitCode ?? 0
  })

  // Convert streams for compatibility
  const stdoutStream = stdout === "pipe" ? nodeStreamToWebStream(subprocess.stdout as Readable | null) : null
  const stderrStream = stderr === "pipe" ? nodeStreamToWebStream(subprocess.stderr as Readable | null) : null

  return {
    get exited() {
      return exited
    },
    get exitCode() {
      return exitCode
    },
    get stdout() {
      return stdoutStream
    },
    get stderr() {
      return stderrStream
    },
    async text(): Promise<string> {
      await exited
      return stdoutText
    },
    async stderrText(): Promise<string> {
      await exited
      return stderrText
    },
    kill(signal?: NodeJS.Signals) {
      subprocess.kill(signal)
    },
  }
}

/**
 * Spawn and wait for completion, returning result
 * Convenience wrapper for simple command execution
 */
export async function exec(
  cmd: string[],
  options?: Omit<SpawnOptions, "cmd">
): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  const proc = spawn({ cmd, stdout: "pipe", stderr: "pipe", ...options })
  await proc.exited
  return {
    exitCode: proc.exitCode,
    stdout: await proc.text(),
    stderr: await proc.stderrText(),
  }
}
