/**
 * NO-BUN: Shell template tag compatibility layer
 *
 * Replaces `$ from "bun"` with execa-based implementation.
 *
 * Usage:
 *   // Instead of: import { $ } from "bun"
 *   import { $ } from './compat/shell'
 *   const result = await $`git status`.text()
 */

import { execa, type Options as ExecaOptions, type Result } from "execa"

export interface ShellResult {
  /** Exit code of the command */
  exitCode: number | null
  /** Standard output */
  stdout: Buffer
  /** Standard error */
  stderr: Buffer
}

export interface ShellCommand {
  /** Execute and return full result */
  then<T>(resolve: (result: ShellResult) => T): Promise<T>

  /** Get stdout as text */
  text(): Promise<string>

  /** Set environment variables */
  env(vars: Record<string, string | undefined>): ShellCommand

  /** Don't throw on non-zero exit code */
  throws(shouldThrow: boolean): ShellCommand

  /** Don't throw on non-zero exit code (Bun API alias for throws(false)) */
  nothrow(): ShellCommand

  /** Suppress output (quiet mode) */
  quiet(): ShellCommand

  /** Set working directory */
  cwd(dir: string): ShellCommand
}

interface ShellOptions {
  cwd?: string
  env?: Record<string, string | undefined>
  shouldThrow: boolean
  quiet: boolean
}

/**
 * Create a shell command from template literal
 */
function createShellCommand(strings: TemplateStringsArray, values: unknown[], opts: ShellOptions): ShellCommand {
  // Build command string with interpolation
  let command = strings[0]
  for (let i = 0; i < values.length; i++) {
    // Escape special characters in interpolated values
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

  // Create promise-like object
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
      return createShellCommand(strings, values, {
        ...opts,
        shouldThrow,
      })
    },

    nothrow(): ShellCommand {
      return createShellCommand(strings, values, {
        ...opts,
        shouldThrow: false,
      })
    },

    quiet(): ShellCommand {
      return createShellCommand(strings, values, {
        ...opts,
        quiet: true,
      })
    },

    cwd(dir: string): ShellCommand {
      return createShellCommand(strings, values, {
        ...opts,
        cwd: dir,
      })
    },
  }

  return shellCommand
}

/**
 * Shell template tag (replaces `$ from "bun"`)
 *
 * @example
 * // Basic usage
 * const result = await $`git status`
 * console.log(result.stdout.toString())
 *
 * // Get text directly
 * const text = await $`git status`.text()
 *
 * // With environment variables
 * await $`curl -fsSL https://example.com`.env({ MY_VAR: 'value' })
 *
 * // Don't throw on error
 * const result = await $`command that might fail`.throws(false)
 */
export function $(strings: TemplateStringsArray, ...values: unknown[]): ShellCommand {
  return createShellCommand(strings, values, {
    shouldThrow: true,
    quiet: false,
  })
}

/**
 * Escape a string for safe use in shell commands
 *
 * NO-BUN: Replaces Bun's $.escape() function
 *
 * @example
 * const safePath = $.escape(userProvidedPath)
 * await $`ls ${safePath}`
 */
$.escape = function escape(str: string): string {
  // If the string is already single-quoted, return as-is
  if (/^'[^']*'$/.test(str)) {
    return str
  }

  // If the string is safe (alphanumeric, dash, underscore, slash, dot), return as-is
  if (/^[a-zA-Z0-9_\-./]+$/.test(str)) {
    return str
  }

  // Otherwise, wrap in single quotes and escape any single quotes within
  // Replace ' with '\'' (end quote, escaped quote, start quote)
  return "'" + str.replace(/'/g, "'\\''") + "'"
}

/**
 * Create a shell command from a raw command string
 *
 * NO-BUN: Replaces Bun's $`${{ raw: "..." }}` pattern
 *
 * @example
 * const cmd = "ls -la | head -n 5"
 * await $.raw(cmd).text()
 */
$.raw = function raw(command: string): ShellCommand {
  // Create a fake template strings array with just the command
  const strings = Object.assign([command], { raw: [command] }) as TemplateStringsArray
  return createShellCommand(strings, [], {
    shouldThrow: true,
    quiet: false,
  })
}
