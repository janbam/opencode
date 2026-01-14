/**
 * Bun shell template tag polyfill for Node.js
 *
 * Replaces `$ from "bun"` with execa-based implementation.
 */

import { execa, type Options as ExecaOptions, type Result } from "execa"

export interface ShellResult {
  exitCode: number | null
  stdout: Buffer
  stderr: Buffer
  /** Combined stdout as string (text property for compatibility) */
  text: string
}

/**
 * Shell execution error (replaces $.ShellError)
 */
export class ShellError extends Error {
  exitCode: number | null
  stdout: Buffer
  stderr: Buffer
  command: string

  constructor(message: string, exitCode: number | null, stdout: Buffer, stderr: Buffer, command: string) {
    super(message)
    this.name = "ShellError"
    this.exitCode = exitCode
    this.stdout = stdout
    this.stderr = stderr
    this.command = command
  }
}

export interface ShellCommand {
  then<T>(resolve: (result: ShellResult) => T): Promise<T>
  catch<T>(reject: (error: Error) => T): Promise<ShellResult | T>
  text(): Promise<string>
  lines(): AsyncIterable<string>
  arrayBuffer(): Promise<ArrayBuffer>
  env(vars: Record<string, string | undefined>): ShellCommand
  throws(shouldThrow: boolean): ShellCommand
  nothrow(): ShellCommand
  quiet(): ShellCommand
  cwd(dir: string): ShellCommand
}

interface ShellOptions {
  cwd?: string
  env?: Record<string, string | undefined>
  shouldThrow: boolean
  quiet: boolean
}

function createShellCommand(strings: TemplateStringsArray, values: unknown[], opts: ShellOptions): ShellCommand {
  // Build command string with interpolation
  let command = strings[0]
  for (let i = 0; i < values.length; i++) {
    const value = String(values[i])
    command += value + strings[i + 1]
  }

  const execaOptions: ExecaOptions = {
    shell: true,
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    reject: opts.shouldThrow,
    stdio: opts.quiet ? ["inherit", "pipe", "pipe"] : undefined,
  }

  let resultPromise: Promise<Result> | null = null

  const getResult = (): Promise<Result> => {
    if (!resultPromise) {
      resultPromise = execa({ ...execaOptions })`${command}`
    }
    return resultPromise
  }

  const shellCommand: ShellCommand = {
    then<T>(resolve: (result: ShellResult) => T): Promise<T> {
      return getResult().then((result) => {
        const stdout = Buffer.from(String(result.stdout ?? ""))
        const stderr = Buffer.from(String(result.stderr ?? ""))
        return resolve({
          exitCode: result.exitCode ?? null,
          stdout,
          stderr,
          text: stdout.toString("utf8"),
        })
      })
    },

    async text(): Promise<string> {
      const result = await getResult()
      return String(result.stdout ?? "")
    },

    async arrayBuffer(): Promise<ArrayBuffer> {
      const result = await getResult()
      const buf = Buffer.from(String(result.stdout ?? ""))
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    },

    async *lines(): AsyncIterable<string> {
      const result = await getResult()
      const text = String(result.stdout ?? "")
      for (const line of text.split("\n")) {
        yield line
      }
    },

    catch<T>(reject: (error: Error) => T): Promise<ShellResult | T> {
      return getResult()
        .then((result) => {
          const stdout = Buffer.from(String(result.stdout ?? ""))
          const stderr = Buffer.from(String(result.stderr ?? ""))
          return {
            exitCode: result.exitCode ?? null,
            stdout,
            stderr,
            text: stdout.toString("utf8"),
          } as ShellResult
        })
        .catch(reject)
    },

    env(vars: Record<string, string | undefined>): ShellCommand {
      return createShellCommand(strings, values, {
        ...opts,
        env: { ...opts.env, ...vars },
      })
    },

    throws(shouldThrow: boolean): ShellCommand {
      return createShellCommand(strings, values, { ...opts, shouldThrow })
    },

    nothrow(): ShellCommand {
      return createShellCommand(strings, values, { ...opts, shouldThrow: false })
    },

    quiet(): ShellCommand {
      return createShellCommand(strings, values, { ...opts, quiet: true })
    },

    cwd(dir: string): ShellCommand {
      return createShellCommand(strings, values, { ...opts, cwd: dir })
    },
  }

  return shellCommand
}

/**
 * Shell template tag (replaces `$ from "bun"`)
 */
export function $(strings: TemplateStringsArray, ...values: unknown[]): ShellCommand {
  return createShellCommand(strings, values, {
    shouldThrow: true,
    quiet: false,
  })
}

/**
 * Escape a string for safe use in shell commands
 */
$.escape = function escape(str: string): string {
  if (/^'[^']*'$/.test(str)) return str
  if (/^[a-zA-Z0-9_\-./]+$/.test(str)) return str
  return "'" + str.replace(/'/g, "'\\''") + "'"
}

/**
 * Create a shell command from a raw command string
 */
$.raw = function raw(command: string): ShellCommand {
  const strings = Object.assign([command], { raw: [command] }) as TemplateStringsArray
  return createShellCommand(strings, [], { shouldThrow: true, quiet: false })
}

/**
 * Shell error class attached to $ for instanceof checks
 */
$.ShellError = ShellError
