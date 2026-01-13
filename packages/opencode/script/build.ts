#!/usr/bin/env tsx
/**
 * Build script for opencode
 *
 * NO-BUN: Replaces the Bun-based publish.ts with a Node.js-compatible build
 *
 * What this does:
 * 1. Bundles TypeScript with esbuild → dist/opencode.cjs
 * 2. Builds the Go TUI → dist/tui
 * 3. Creates a launcher script → dist/opencode
 *
 * Scope: Linux x64 only, local deployment
 */

import * as esbuild from "esbuild"
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

// Build the TypeScript bundle with esbuild
async function buildJS(version: string): Promise<void> {
  console.log("📦 Bundling TypeScript...")

  await esbuild.build({
    entryPoints: [path.join(packageDir, "src/index.ts")],
    bundle: true,
    platform: "node",
    target: "node22",
    format: "esm",
    outfile: path.join(distDir, "opencode.mjs"),
    minify: true,
    sourcemap: false,
    // Inline .txt files as strings
    loader: {
      ".txt": "text",
    },
    // Define version constant
    define: {
      "process.env.OPENCODE_VERSION": JSON.stringify(version),
    },
    // Keep all npm packages external to avoid CJS→ESM conversion issues
    // This prevents "Dynamic require" errors while still bundling our code
    packages: "external",
    // Prefer ESM entry points from deps
    mainFields: ["module", "main"],
    conditions: ["node", "import"],
    // Banner with shebang for direct execution
    banner: {
      js: "#!/usr/bin/env node",
    },
  })

  // Make the bundle executable
  await chmod(path.join(distDir, "opencode.mjs"), 0o755)

  console.log("✅ Bundle created: dist/opencode.mjs")
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

// Create launcher script
async function createLauncher(): Promise<void> {
  console.log("📝 Creating launcher script...")

  const launcher = `#!/bin/sh
# opencode launcher - runs the bundled Node.js application
# The TUI binary is expected to be in the same directory

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export OPENCODE_TUI_PATH="\${SCRIPT_DIR}/tui"

exec node "\${SCRIPT_DIR}/opencode.mjs" "$@"
`

  await writeFile(path.join(distDir, "opencode"), launcher)
  await chmod(path.join(distDir, "opencode"), 0o755)

  console.log("✅ Launcher created: dist/opencode")
}

// Main build process
async function main(): Promise<void> {
  const startTime = Date.now()

  console.log("🚀 Starting opencode build (Linux x64)\n")

  // Clean dist directory
  if (existsSync(distDir)) {
    await rm(distDir, { recursive: true })
  }
  await mkdir(distDir, { recursive: true })

  const version = await getVersion()
  console.log(`📋 Version: ${version}\n`)

  // Run build steps
  await buildJS(version)
  await buildTUI(version)
  await createLauncher()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n✨ Build complete in ${elapsed}s`)
  console.log(`\n📁 Output: ${distDir}`)
  console.log("   - opencode      (launcher script)")
  console.log("   - opencode.mjs  (bundled JS)")
  console.log("   - tui           (Go binary)")
  console.log("\nRun with: ./dist/opencode")
}

main().catch((err) => {
  console.error("❌ Build failed:", err)
  process.exit(1)
})
