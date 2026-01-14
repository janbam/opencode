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
}

export interface ShellCommand {
  then<T>(resolve: (result: ShellResult) => T): Promise<T>
  text(): Promise<string>
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
      return getResult().then((result) =>
        resolve({
          exitCode: result.exitCode ?? null,
          stdout: Buffer.from(String(result.stdout ?? "")),
          stderr: Buffer.from(String(result.stderr ?? "")),
        })
      )
    },

    async text(): Promise<string> {
      const result = await getResult()
      return String(result.stdout ?? "")
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
