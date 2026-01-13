/**
 * TUI Binary Resolver
 *
 * Resolves the TUI binary location for different deployment scenarios:
 * 1. Dev mode: Uses `go run` to run from source
 * 2. Built mode: Looks for compiled binary at known paths
 *
 * NO-BUN: This module replaces the Bun.embeddedFiles approach with
 * a file-system based resolution strategy.
 */

import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "../compat/url"
import { Global } from "../global"
import { Installation } from "../installation"
import { which } from "../compat/which"

export interface TuiCommand {
  cmd: string[]
  cwd: string
}

/**
 * Resolve the TUI command based on current environment
 *
 * Resolution order:
 * 1. OPENCODE_TUI_PATH env var → use specified path (highest priority)
 * 2. Dev mode → `go run ./main.go`
 * 3. Global bin path → ~/.local/share/opencode/bin/tui
 * 4. Project dist path → dist/tui/linux-x64/tui
 * 5. Adjacent to CLI → look next to the running executable
 */
export async function resolveTui(): Promise<TuiCommand> {
  // Check OPENCODE_TUI_PATH env var first (takes priority over dev mode)
  const envPath = process.env["OPENCODE_TUI_PATH"]
  if (envPath) {
    const exists = await fileExists(envPath)
    if (exists) {
      return {
        cmd: [envPath],
        cwd: process.cwd(),
      }
    }
  }

  // Dev mode: use `go run` from source
  if (Installation.isDev()) {
    const tuiSourceDir = fileURLToPath(
      new URL("../../../../tui/cmd/opencode", import.meta.url)
    )
    return {
      cmd: ["go", "run", "./main.go"],
      cwd: tuiSourceDir,
    }
  }

  // Check global bin path
  const globalBin = path.join(Global.Path.bin, "tui")
  if (await fileExists(globalBin)) {
    return {
      cmd: [globalBin],
      cwd: process.cwd(),
    }
  }

  // Check project dist path (relative to source)
  const distPaths = [
    // From packages/opencode/src/tui/ to dist/
    fileURLToPath(new URL("../../../../dist/tui/linux-x64/tui", import.meta.url)),
    fileURLToPath(new URL("../../../../dist/tui/tui", import.meta.url)),
    fileURLToPath(new URL("../../../../../dist/tui/tui", import.meta.url)),
  ]

  for (const distPath of distPaths) {
    if (await fileExists(distPath)) {
      return {
        cmd: [distPath],
        cwd: process.cwd(),
      }
    }
  }

  // Check adjacent to executable (for bundled deployment)
  const execDir = path.dirname(process.execPath)
  const adjacentPaths = [
    path.join(execDir, "tui"),
    path.join(execDir, "..", "tui"),
    path.join(execDir, "..", "lib", "tui"),
  ]

  for (const adjacentPath of adjacentPaths) {
    if (await fileExists(adjacentPath)) {
      return {
        cmd: [adjacentPath],
        cwd: process.cwd(),
      }
    }
  }

  // If we get here, try to build TUI on the fly (if Go is available)
  const goPath = await which("go")
  if (goPath) {
    const tuiSourceDir = fileURLToPath(
      new URL("../../../../tui/cmd/opencode", import.meta.url)
    )
    const tuiSourceExists = await fileExists(path.join(tuiSourceDir, "main.go"))

    if (tuiSourceExists) {
      // Fall back to go run if source is available
      return {
        cmd: ["go", "run", "./main.go"],
        cwd: tuiSourceDir,
      }
    }
  }

  // Last resort: throw an error with helpful instructions
  throw new TuiNotFoundError()
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}

export class TuiNotFoundError extends Error {
  constructor() {
    super(
      `TUI binary not found.

To resolve this, either:
1. Set OPENCODE_TUI_PATH environment variable to the TUI binary
2. Build TUI and place it at: ${path.join(Global.Path.bin, "tui")}
3. Run in dev mode with Go installed

To build TUI:
  cd packages/tui && go build -o ~/.local/share/opencode/bin/tui ./cmd/opencode`
    )
    this.name = "TuiNotFoundError"
  }
}
