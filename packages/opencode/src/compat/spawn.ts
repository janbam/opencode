/**
 * Bun process spawning polyfill for Node.js
 *
 * Replaces Bun.spawn() with execa-based implementation.
 */

import { execa, type Options as ExecaOptions } from "execa"
import { Readable } from "node:stream"

export type StdioOption = "pipe" | "inherit" | "ignore" | null | undefined

export interface SpawnOptions {
  cmd: string[]
  cwd?: string
  env?: Record<string, string | undefined>
  stdin?: StdioOption
  stdout?: StdioOption
  stderr?: StdioOption
  signal?: AbortSignal
  timeout?: number
  onExit?: (code: number | null) => void
}

export interface Subprocess {
  readonly exited: Promise<number>
  readonly exitCode: number | null
  readonly stdout: ReadableStream<Uint8Array> | null
  readonly stderr: ReadableStream<Uint8Array> | null
  readonly stdin: WritableStream<Uint8Array> | null
  readonly pid: number
  text(): Promise<string>
  kill(signal?: NodeJS.Signals): void
}

function nodeStreamToWebStream(nodeStream: Readable | null): ReadableStream<Uint8Array> | null {
  if (!nodeStream) return null

  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk))
      })
      nodeStream.on("end", () => controller.close())
      nodeStream.on("error", (err) => controller.error(err))
    },
    cancel() {
      nodeStream.destroy()
    },
  })
}

/**
 * Spawn a child process (replaces Bun.spawn())
 */
export function spawn(options: SpawnOptions): Subprocess
export function spawn(cmd: string[], options?: Omit<SpawnOptions, "cmd">): Subprocess
export function spawn(
  cmdOrOptions: string[] | SpawnOptions,
  maybeOptions?: Omit<SpawnOptions, "cmd">
): Subprocess {
  const options: SpawnOptions = Array.isArray(cmdOrOptions)
    ? { cmd: cmdOrOptions, ...maybeOptions }
    : cmdOrOptions

  const [command, ...args] = options.cmd

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
    reject: false,
    buffer: true,
  }

  const subprocess = execa(command, args, execaOptions)

  let exitCode: number | null = null
  let stdoutText = ""

  const exited = subprocess.then((result): number => {
    exitCode = result.exitCode ?? null
    stdoutText = String(result.stdout ?? "")

    if (options.onExit) {
      options.onExit(exitCode)
    }

    return exitCode ?? 0
  })

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
    get stdin() {
      return null // TODO: implement if needed
    },
    get pid() {
      return subprocess.pid ?? 0
    },
    async text(): Promise<string> {
      await exited
      return stdoutText
    },
    kill(signal?: NodeJS.Signals) {
      subprocess.kill(signal)
    },
  }
}
