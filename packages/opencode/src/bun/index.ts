import { z } from "zod"
import { Global } from "../global"
import { Log } from "../util/log"
import path from "path"
import { NamedError } from "../util/error"
// NO-BUN: replaced bun imports with compat layer and fs/promises
// // import { readableStreamToText } from "bun"
import { spawn, SpawnOptions } from "../compat/spawn"
import { readFile, writeFile } from "fs/promises"
import { exists } from "../compat/file"

// TODO: Consider renaming BunProc to RuntimeInstaller since it no longer uses Bun
export namespace BunProc {
  const log = Log.create({ service: "bun" })

  // NO-BUN: replaced Bun.spawn with compat spawn, using npm instead of bun CLI
  // // export async function run(cmd: string[], options?: Bun.SpawnOptions.OptionsObject<any, any, any>) {
  export async function run(cmd: string[], options?: Omit<SpawnOptions, "cmd">) {
    log.info("running", {
      cmd: ["npm", ...cmd],
      ...options,
    })
    // // const result = Bun.spawn([which(), ...cmd], {
    const result = spawn({
      cmd: ["npm", ...cmd],
      ...options,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        ...options?.env,
      },
    })
    const exitCode = await result.exited
    const stdout = await result.text()
    const stderr = await result.stderrText()
    log.info("done", {
      exitCode,
      stdout,
      stderr,
    })
    if (exitCode !== 0) {
      throw new Error(`Command failed with exit code ${exitCode}`)
    }
    return { exited: exitCode, stdout, stderr }
  }

  export function which() {
    return process.execPath
  }

  export const InstallFailedError = NamedError.create(
    "BunInstallFailedError",
    z.object({
      pkg: z.string(),
      version: z.string(),
    }),
  )

  // NO-BUN: replaced Bun.file/Bun.write with fs/promises, changed bun add to npm install
  export async function install(pkg: string, version = "latest") {
    const mod = path.join(Global.Path.cache, "node_modules", pkg)
    const pkgjsonPath = path.join(Global.Path.cache, "package.json")
    // // const pkgjson = Bun.file(path.join(Global.Path.cache, "package.json"))
    // // const parsed = await pkgjson.json().catch(async () => {
    let parsed: { dependencies: Record<string, string> }
    if (await exists(pkgjsonPath)) {
      parsed = JSON.parse(await readFile(pkgjsonPath, "utf8"))
    } else {
      parsed = { dependencies: {} }
      await writeFile(pkgjsonPath, JSON.stringify(parsed, null, 2))
    }
    if (parsed.dependencies[pkg] === version) return mod
    // // await BunProc.run(["add", "--force", "--exact", ...], ...)
    await BunProc.run(
      [
        "install",
        "--save-exact",
        "--prefix",
        Global.Path.cache,
        "--registry=https://registry.npmjs.org",
        pkg + "@" + version,
      ],
      {
        cwd: Global.Path.cache,
      },
    ).catch((e) => {
      throw new InstallFailedError(
        { pkg, version },
        {
          cause: e,
        },
      )
    })
    parsed.dependencies[pkg] = version
    // // await Bun.write(pkgjson.name!, JSON.stringify(parsed, null, 2))
    await writeFile(pkgjsonPath, JSON.stringify(parsed, null, 2))
    return mod
  }
}
