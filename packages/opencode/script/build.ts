#!/usr/bin/env tsx
/**
 * Build script for opencode (Linux local deployment)
 *
 * NO-BUN: Replaces the Bun-based publish.ts with a Node.js-compatible build
 *
 * What this does:
 * 1. Builds the Go TUI → dist/tui
 * 2. Creates a launcher script → dist/opencode
 *
 * The launcher uses tsx to run the source TypeScript directly.
 * This bypasses all ESM bundling complexity while working perfectly.
 *
 * Scope: Linux x64 only, local deployment
 */

import { execSync } from "child_process"
import { mkdir, writeFile, chmod, rm } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageDir = path.resolve(__dirname, "..")
const rootDir = path.resolve(packageDir, "../..")
const tuiDir = path.resolve(rootDir, "packages/tui")
const distDir = path.resolve(packageDir, "dist")

// Get version from git tag or use dev version
async function getVersion(): Promise<string> {
  try {
    const tag = execSync("git describe --tags --abbrev=0", { encoding: "utf-8" }).trim()
    return tag.startsWith("v") ? tag.substring(1) : tag
  } catch {
    return "0.0.0-dev"
  }
}

// Build the Go TUI binary
async function buildTUI(version: string): Promise<void> {
  console.log("🔨 Building Go TUI...")

  const tuiOutput = path.join(distDir, "tui")

  // Build for Linux x64 only
  const env = {
    ...process.env,
    CGO_ENABLED: "0",
    GOOS: "linux",
    GOARCH: "amd64",
  }

  const ldflags = `-s -w -X main.Version=${version}`

  execSync(`go build -ldflags="${ldflags}" -o "${tuiOutput}" ./cmd/opencode/main.go`, {
    cwd: tuiDir,
    env,
    stdio: "inherit",
  })

  console.log("✅ TUI built: dist/tui")
}

// Create launcher script that uses tsx to run source directly
async function createLauncher(): Promise<void> {
  console.log("📝 Creating launcher script...")

  // Find paths relative to where the script will be installed
  const launcher = `#!/bin/sh
# opencode launcher - runs TypeScript source via tsx
# NO-BUN: Uses tsx instead of bundling to avoid ESM complexity

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Set TUI path to the built binary
export OPENCODE_TUI_PATH="\${SCRIPT_DIR}/tui"

# The source is in ../src relative to dist/
# For local deployment, we know the repo structure
PACKAGE_DIR="$(cd "\${SCRIPT_DIR}/.." && pwd)"
ENTRY_POINT="\${PACKAGE_DIR}/src/index.ts"

# Use tsx to run the TypeScript directly
exec npx tsx "\${ENTRY_POINT}" "$@"
`

  await writeFile(path.join(distDir, "opencode"), launcher)
  await chmod(path.join(distDir, "opencode"), 0o755)

  console.log("✅ Launcher created: dist/opencode")
}

// Main build process
async function main(): Promise<void> {
  const startTime = Date.now()

  console.log("🚀 Starting opencode build (Linux x64, tsx-based)\n")

  // Clean dist directory
  if (existsSync(distDir)) {
    await rm(distDir, { recursive: true })
  }
  await mkdir(distDir, { recursive: true })

  const version = await getVersion()
  console.log(`📋 Version: ${version}\n`)

  // Run build steps
  await buildTUI(version)
  await createLauncher()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n✨ Build complete in ${elapsed}s`)
  console.log(`\n📁 Output: ${distDir}`)
  console.log("   - opencode  (launcher script)")
  console.log("   - tui       (Go binary)")
  console.log("\nRun with: ./dist/opencode")
}

main().catch((err) => {
  console.error("❌ Build failed:", err)
  process.exit(1)
})
