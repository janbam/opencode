import path from "path"
import { Provider } from "../../provider/provider"
import { Server } from "../../server/server"
import { bootstrap } from "../bootstrap"
import { UI } from "../ui"
import { cmd } from "./cmd"
import { Installation } from "../../installation"
import { Config } from "../../config/config"
import { Bus } from "../../bus"
import { Log } from "../../util/log"
import { FileWatcher } from "../../file/watch"
import { Mode } from "../../session/mode"
// NO-BUN: added compat imports for spawn
import { spawn } from "../../compat/spawn"
// NO-BUN: TUI resolution now handled by src/tui/index.ts
import { resolveTui } from "../../tui"

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

        // NO-BUN: TUI resolution replaces Bun.embeddedFiles approach
        // Original Bun code extracted TUI from embedded SEA assets.
        // Now we use resolveTui() which checks multiple locations:
        // - Dev mode: go run ./main.go
        // - Production: looks for built binary at known paths
        // // if (Bun.embeddedFiles.length > 0) {
        // //   const blob = Bun.embeddedFiles[0] as File
        // //   const binary = path.join(Global.Path.cache, "tui", blob.name)
        // //   if (!(await Bun.file(binary).exists())) {
        // //     await Bun.write(binary, blob, { mode: 0o755 })
        // //   }
        // //   tuiCmd = [binary]
        // // }
        const tui = await resolveTui()

        Log.Default.info("tui", {
          cmd: tui.cmd,
          cwd: tui.cwd,
        })
        // // const proc = Bun.spawn({ cmd: [...], ... })
        const proc = spawn({
          cmd: [
            ...tui.cmd,
            ...(args.model ? ["--model", args.model] : []),
            ...(args.prompt ? ["--prompt", args.prompt] : []),
            ...(args.mode ? ["--mode", args.mode] : []),
          ],
          cwd: tui.cwd,
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
 * In development: ["tsx", "packages/opencode/src/index.ts"] or similar
 * In production: ["/path/to/opencode"]
 */
function getOpencodeCommand(): string[] {
  // Check if OPENCODE_BIN_PATH is set (used by shell wrapper scripts)
  if (process.env["OPENCODE_BIN_PATH"]) {
    return [process.env["OPENCODE_BIN_PATH"]]
  }

  const execPath = process.execPath.toLowerCase()

  if (Installation.isDev()) {
    // In development, use the runtime (tsx/node) to run the TypeScript entry point
    return [execPath, "run", process.argv[1]]
  }

  // In production, use the current executable path
  return [process.execPath]
}
