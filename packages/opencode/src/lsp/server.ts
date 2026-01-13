import { spawn as nodeSpawn, type ChildProcessWithoutNullStreams } from "child_process"
import type { App } from "../app/app"
import path from "path"
import { Global } from "../global"
import { Log } from "../util/log"
import fs from "fs/promises"
import { Filesystem } from "../util/filesystem"
// NO-BUN: replaced Bun APIs with compat layer
// // import { BunProc } from "../bun"
// // import { $ } from "bun"
// // Bun.resolve(), Bun.which(), Bun.spawn(), Bun.file()
import { $, which, spawn, resolve, exists, write } from "../compat"

export namespace LSPServer {
  const log = Log.create({ service: "lsp.server" })

  export interface Handle {
    process: ChildProcessWithoutNullStreams
    initialization?: Record<string, any>
  }

  type RootFunction = (file: string, app: App.Info) => Promise<string | undefined>

  const NearestRoot = (patterns: string[]): RootFunction => {
    return async (file, app) => {
      const files = Filesystem.up({
        targets: patterns,
        start: path.dirname(file),
        stop: app.path.root,
      })
      const first = await files.next()
      await files.return()
      if (!first.value) return app.path.root
      return path.dirname(first.value)
    }
  }

  export interface Info {
    id: string
    extensions: string[]
    global?: boolean
    root: RootFunction
    spawn(app: App.Info, root: string): Promise<Handle | undefined>
  }

  export const Typescript: Info = {
    id: "typescript",
    root: NearestRoot(["tsconfig.json", "package.json", "jsconfig.json"]),
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"],
    async spawn(app, root) {
      // NO-BUN: Use compat/resolve instead of Bun.resolve, npx instead of bun x
      const tsserver = await resolve("typescript/lib/tsserver.js", app.path.cwd).catch(() => {})
      if (!tsserver) return
      const proc = nodeSpawn("npx", ["typescript-language-server", "--stdio"], {
        cwd: root,
        env: {
          ...process.env,
        },
      })
      return {
        process: proc,
        initialization: {
          tsserver: {
            path: tsserver,
          },
        },
      }
    },
  }

  export const Gopls: Info = {
    id: "golang",
    root: async (file, app) => {
      const work = await NearestRoot(["go.work"])(file, app)
      if (work) return work
      return NearestRoot(["go.mod", "go.sum"])(file, app)
    },
    extensions: [".go"],
    async spawn(_, root) {
      // NO-BUN: Use compat/which and compat/spawn
      let bin = await which("gopls", {
        path: process.env["PATH"] + ":" + Global.Path.bin,
      })
      if (!bin) {
        if (!(await which("go"))) return
        log.info("installing gopls")
        const proc = spawn({
          cmd: ["go", "install", "golang.org/x/tools/gopls@latest"],
          env: { ...process.env, GOBIN: Global.Path.bin },
          stdout: "pipe",
          stderr: "pipe",
          stdin: "pipe",
        })
        const exit = await proc.exited
        if (exit !== 0) {
          log.error("Failed to install gopls")
          return
        }
        // NO-BUN: Linux only, no .exe extension needed
        bin = path.join(Global.Path.bin, "gopls")
        log.info(`installed gopls`, {
          bin,
        })
      }
      return {
        process: nodeSpawn(bin!, {
          cwd: root,
        }),
      }
    },
  }

  export const RubyLsp: Info = {
    id: "ruby-lsp",
    root: NearestRoot(["Gemfile"]),
    extensions: [".rb", ".rake", ".gemspec", ".ru"],
    async spawn(_, root) {
      // NO-BUN: Use compat/which and compat/spawn
      let bin = await which("ruby-lsp", {
        path: process.env["PATH"] + ":" + Global.Path.bin,
      })
      if (!bin) {
        const ruby = await which("ruby")
        const gem = await which("gem")
        if (!ruby || !gem) {
          log.info("Ruby not found, please install Ruby first")
          return
        }
        log.info("installing ruby-lsp")
        const proc = spawn({
          cmd: ["gem", "install", "ruby-lsp", "--bindir", Global.Path.bin],
          stdout: "pipe",
          stderr: "pipe",
          stdin: "pipe",
        })
        const exit = await proc.exited
        if (exit !== 0) {
          log.error("Failed to install ruby-lsp")
          return
        }
        // NO-BUN: Linux only, no .exe extension needed
        bin = path.join(Global.Path.bin, "ruby-lsp")
        log.info(`installed ruby-lsp`, {
          bin,
        })
      }
      return {
        process: nodeSpawn(bin!, ["--stdio"], {
          cwd: root,
        }),
      }
    },
  }

  export const Pyright: Info = {
    id: "pyright",
    extensions: [".py", ".pyi"],
    root: NearestRoot(["pyproject.toml", "setup.py", "setup.cfg", "requirements.txt", "Pipfile", "pyrightconfig.json"]),
    async spawn(_, root) {
      // NO-BUN: Use npx instead of bun x
      const proc = nodeSpawn("npx", ["pyright-langserver", "--stdio"], {
        cwd: root,
        env: {
          ...process.env,
        },
      })
      return {
        process: proc,
      }
    },
  }

  export const ElixirLS: Info = {
    id: "elixir-ls",
    extensions: [".ex", ".exs"],
    root: NearestRoot(["mix.exs", "mix.lock"]),
    async spawn(_, root) {
      // NO-BUN: Use compat layer for which, exists, write, $
      let binary = await which("elixir-ls")
      if (!binary) {
        const elixirLsPath = path.join(Global.Path.bin, "elixir-ls")
        // NO-BUN: Linux only, no .bar extension needed
        binary = path.join(
          Global.Path.bin,
          "elixir-ls-master",
          "release",
          "language_server.sh",
        )

        if (!(await exists(binary))) {
          const elixir = await which("elixir")
          if (!elixir) {
            log.error("elixir is required to run elixir-ls")
            return
          }

          log.info("downloading elixir-ls from GitHub releases")

          const response = await fetch("https://github.com/elixir-lsp/elixir-ls/archive/refs/heads/master.zip")
          if (!response.ok) return
          const zipPath = path.join(Global.Path.bin, "elixir-ls.zip")
          // NO-BUN: Use compat/write with Buffer from response
          const buffer = Buffer.from(await response.arrayBuffer())
          await write(zipPath, buffer)

          await $`unzip -o -q ${zipPath}`.cwd(Global.Path.bin).nothrow()

          await fs.rm(zipPath, {
            force: true,
            recursive: true,
          })

          await $`mix deps.get && mix compile && mix elixir_ls.release2 -o release`
            .quiet()
            .cwd(path.join(Global.Path.bin, "elixir-ls-master"))
            .env({ MIX_ENV: "prod", ...process.env })

          log.info(`installed elixir-ls`, {
            path: elixirLsPath,
          })
        }
      }

      return {
        process: nodeSpawn(binary, {
          cwd: root,
        }),
      }
    },
  }

  export const Zls: Info = {
    id: "zls",
    extensions: [".zig", ".zon"],
    root: NearestRoot(["build.zig"]),
    async spawn(_, root) {
      // NO-BUN: Use compat layer for which, exists, write, $
      let bin = await which("zls", {
        path: process.env["PATH"] + ":" + Global.Path.bin,
      })

      if (!bin) {
        const zig = await which("zig")
        if (!zig) {
          log.error("Zig is required to use zls. Please install Zig first.")
          return
        }

        log.info("downloading zls from GitHub releases")

        const releaseResponse = await fetch("https://api.github.com/repos/zigtools/zls/releases/latest")
        if (!releaseResponse.ok) {
          log.error("Failed to fetch zls release info")
          return
        }

        const release = (await releaseResponse.json()) as { assets: Array<{ name: string; browser_download_url: string }> }

        // NO-BUN: Linux only, simplified platform detection
        const arch = process.arch
        let zlsArch: string = arch
        if (arch === "arm64") zlsArch = "aarch64"
        else if (arch === "x64") zlsArch = "x86_64"
        else if (arch === "ia32") zlsArch = "x86"

        const assetName = `zls-${zlsArch}-linux.tar.xz`

        const supportedCombos = [
          "zls-x86_64-linux.tar.xz",
          "zls-aarch64-linux.tar.xz",
          "zls-x86-linux.tar.xz",
        ]

        if (!supportedCombos.includes(assetName)) {
          log.error(`Architecture ${arch} is not supported by zls on Linux`)
          return
        }

        const asset = release.assets.find((a: any) => a.name === assetName)
        if (!asset) {
          log.error(`Could not find asset ${assetName} in latest zls release`)
          return
        }

        const downloadUrl = asset.browser_download_url
        const downloadResponse = await fetch(downloadUrl)
        if (!downloadResponse.ok) {
          log.error("Failed to download zls")
          return
        }

        const tempPath = path.join(Global.Path.bin, assetName)
        // NO-BUN: Use compat/write with Buffer from response
        const buffer = Buffer.from(await downloadResponse.arrayBuffer())
        await write(tempPath, buffer)

        await $`tar -xf ${tempPath}`.cwd(Global.Path.bin).nothrow()

        await fs.rm(tempPath, { force: true })

        bin = path.join(Global.Path.bin, "zls")

        if (!(await exists(bin))) {
          log.error("Failed to extract zls binary")
          return
        }

        await $`chmod +x ${bin}`.nothrow()

        log.info(`installed zls`, { bin })
      }

      return {
        process: nodeSpawn(bin, {
          cwd: root,
        }),
      }
    },
  }
}
