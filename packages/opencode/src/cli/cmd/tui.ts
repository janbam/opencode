import { Global } from "../../global"
import { Provider } from "../../provider/provider"
import { Server } from "../../server/server"
import { bootstrap } from "../bootstrap"
import { UI } from "../ui"
import { cmd } from "./cmd"
import path from "path"
import fs from "fs/promises"
import { Installation } from "../../installation"
import { Config } from "../../config/config"
import { Bus } from "../../bus"
import { Log } from "../../util/log"
import { FileWatcher } from "../../file/watch"
import { Mode } from "../../session/mode"
// NO-BUN: added compat imports for spawn and url
import { spawn } from "../../compat/spawn"
import { fileURLToPath } from "../../compat/url"

export const TuiCommand = cmd({
  command: "$0 [project]",
  describe: "start opencode tui",
  builder: (yargs) =>
    yargs
      .positional("project", {
        type: "string",
        describe: "path to start opencode in",
      })
      .option("model", {
        type: "string",
        alias: ["m"],
        describe: "model to use in the format of provider/model",
      })
      .option("prompt", {
        alias: ["p"],
        type: "string",
        describe: "prompt to use",
      })
      .option("mode", {
        type: "string",
        describe: "mode to use",
      }),
  handler: async (args) => {
    while (true) {
      const cwd = args.project ? path.resolve(args.project) : process.cwd()
      try {
        process.chdir(cwd)
      } catch (e) {
        UI.error("Failed to change directory to " + cwd)
        return
      }
      const result = await bootstrap({ cwd }, async (app) => {
        FileWatcher.init()
        const providers = await Provider.list()
        if (Object.keys(providers).length === 0) {
          return "needs_provider"
        }

        const server = Server.listen({
          port: 0,
          hostname: "127.0.0.1",
        })

        // NO-BUN: replaced Bun.fileURLToPath with compat, Bun.spawn with compat
        // // let cwd = Bun.fileURLToPath(new URL("../../../../tui/cmd/opencode", import.meta.url))
        let tuiCmd = ["go", "run", "./main.go"]
        let tuiCwd = fileURLToPath(new URL("../../../../tui/cmd/opencode", import.meta.url))

        // TODO: Phase 3 - TUI Download Approach
        // In Bun SEA builds, the TUI binary was embedded. For Node.js, we'll download it on first run.
        // For now, dev mode uses `go run` which works without the embedded binary.
        // The download logic will go here in Phase 3 (see dev_docs/ROADMAP.md Phase 3)
        // // if (Bun.embeddedFiles.length > 0) {
        // //   const blob = Bun.embeddedFiles[0] as File
        // //   let binaryName = blob.name
        // //   if (process.platform === "win32" && !binaryName.endsWith(".exe")) {
        // //     binaryName += ".exe"
        // //   }
        // //   const binary = path.join(Global.Path.cache, "tui", binaryName)
        // //   const file = Bun.file(binary)
        // //   if (!(await file.exists())) {
        // //     await Bun.write(file, blob, { mode: 0o755 })
        // //     await fs.chmod(binary, 0o755)
        // //   }
        // //   tuiCwd = process.cwd()
        // //   tuiCmd = [binary]
        // // }

        Log.Default.info("tui", {
          cmd: tuiCmd,
        })
        // // const proc = Bun.spawn({ cmd: [...], ... })
        const proc = spawn({
          cmd: [
            ...tuiCmd,
            ...(args.model ? ["--model", args.model] : []),
            ...(args.prompt ? ["--prompt", args.prompt] : []),
            ...(args.mode ? ["--mode", args.mode] : []),
          ],
          cwd: tuiCwd,
          stdout: "inherit",
          stderr: "inherit",
          stdin: "inherit",
          env: {
            ...process.env,
            CGO_ENABLED: "0",
            OPENCODE_SERVER: server.url.toString(),
            OPENCODE_APP_INFO: JSON.stringify(app),
            OPENCODE_MODES: JSON.stringify(await Mode.list()),
          },
          onExit: () => {
            server.stop()
          },
        })

        ;(async () => {
          if (Installation.VERSION === "dev") return
          if (Installation.isSnapshot()) return
          const config = await Config.global()
          if (config.autoupdate === false) return
          const latest = await Installation.latest().catch(() => {})
          if (!latest) return
          if (Installation.VERSION === latest) return
          const method = await Installation.method()
          if (method === "unknown") return
          await Installation.upgrade(method, latest)
            .then(() => {
              Bus.publish(Installation.Event.Updated, { version: latest })
            })
            .catch(() => {})
        })()

        await proc.exited
        server.stop()

        return "done"
      })
      if (result === "done") break
      if (result === "needs_provider") {
        UI.empty()
        UI.println(UI.logo("   "))
        // NO-BUN: replaced Bun.spawn with compat spawn
        // // const result = await Bun.spawn({ cmd: [...], ... }).exited
        const authResult = await spawn({
          cmd: [...getOpencodeCommand(), "auth", "login"],
          cwd: process.cwd(),
          stdout: "inherit",
          stderr: "inherit",
          stdin: "inherit",
        }).exited
        if (authResult !== 0) return
        UI.empty()
      }
    }
  },
})

/**
 * Get the correct command to run opencode CLI
 * In development: ["bun", "run", "packages/opencode/src/index.ts"]
 * In production: ["/path/to/opencode"]
 */
function getOpencodeCommand(): string[] {
  // Check if OPENCODE_BIN_PATH is set (used by shell wrapper scripts)
  if (process.env["OPENCODE_BIN_PATH"]) {
    return [process.env["OPENCODE_BIN_PATH"]]
  }

  const execPath = process.execPath.toLowerCase()

  if (Installation.isDev()) {
    // In development, use bun to run the TypeScript entry point
    return [execPath, "run", process.argv[1]]
  }

  // In production, use the current executable path
  return [process.execPath]
}
