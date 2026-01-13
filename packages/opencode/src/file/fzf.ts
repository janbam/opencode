import path from "path"
import { Global } from "../global"
import fs from "fs/promises"
import { z } from "zod"
import { NamedError } from "../util/error"
import { lazy } from "../util/lazy"
import { Log } from "../util/log"
// NO-BUN: Import from compat layer
import { which, file, write, spawn } from "../compat"

export namespace Fzf {
  const log = Log.create({ service: "fzf" })

  const VERSION = "0.62.0"
  const PLATFORM = {
    darwin: { extension: "tar.gz" },
    linux: { extension: "tar.gz" },
    win32: { extension: "zip" },
  } as const

  export const ExtractionFailedError = NamedError.create(
    "FzfExtractionFailedError",
    z.object({
      filepath: z.string(),
      stderr: z.string(),
    }),
  )

  export const UnsupportedPlatformError = NamedError.create(
    "FzfUnsupportedPlatformError",
    z.object({
      platform: z.string(),
    }),
  )

  export const DownloadFailedError = NamedError.create(
    "FzfDownloadFailedError",
    z.object({
      url: z.string(),
      status: z.number(),
    }),
  )

  const state = lazy(async () => {
    // NO-BUN: replaced Bun.which with compat which
    // // let filepath = Bun.which("fzf")
    let filepath = await which("fzf")
    if (filepath) {
      log.info("found", { filepath })
      return { filepath }
    }
    filepath = path.join(Global.Path.bin, "fzf" + (process.platform === "win32" ? ".exe" : ""))

    // NO-BUN: replaced Bun.file with compat file
    // // const file = Bun.file(filepath)
    const fileHandle = file(filepath)
    if (!(await fileHandle.exists())) {
      const archMap = { x64: "amd64", arm64: "arm64" } as const
      const arch = archMap[process.arch as keyof typeof archMap] ?? "amd64"

      const config = PLATFORM[process.platform as keyof typeof PLATFORM]
      if (!config) throw new UnsupportedPlatformError({ platform: process.platform })

      const version = VERSION
      const platformName = process.platform === "win32" ? "windows" : process.platform
      const filename = `fzf-${version}-${platformName}_${arch}.${config.extension}`
      const url = `https://github.com/junegunn/fzf/releases/download/v${version}/${filename}`

      const response = await fetch(url)
      if (!response.ok) throw new DownloadFailedError({ url, status: response.status })

      const buffer = await response.arrayBuffer()
      const archivePath = path.join(Global.Path.bin, filename)
      // NO-BUN: replaced Bun.write with compat write
      // // await Bun.write(archivePath, buffer)
      await write(archivePath, buffer)
      if (config.extension === "tar.gz") {
        // NO-BUN: replaced Bun.spawn with compat spawn
        // // const proc = Bun.spawn(["tar", "-xzf", archivePath, "fzf"], {
        // //   cwd: Global.Path.bin,
        // //   stderr: "pipe",
        // //   stdout: "pipe",
        // // })
        const proc = spawn({
          cmd: ["tar", "-xzf", archivePath, "fzf"],
          cwd: Global.Path.bin,
          stderr: "pipe",
          stdout: "pipe",
        })
        await proc.exited
        if (proc.exitCode !== 0)
          throw new ExtractionFailedError({
            filepath,
            // NO-BUN: use proc.stderrText() instead of Bun.readableStreamToText
            // // stderr: await Bun.readableStreamToText(proc.stderr),
            stderr: await proc.stderrText(),
          })
      }
      if (config.extension === "zip") {
        // NO-BUN: replaced Bun.spawn with compat spawn
        // // const proc = Bun.spawn(["unzip", "-j", archivePath, "fzf.exe", "-d", Global.Path.bin], {
        // //   cwd: Global.Path.bin,
        // //   stderr: "pipe",
        // //   stdout: "ignore",
        // // })
        const proc = spawn({
          cmd: ["unzip", "-j", archivePath, "fzf.exe", "-d", Global.Path.bin],
          cwd: Global.Path.bin,
          stderr: "pipe",
          stdout: "ignore",
        })
        await proc.exited
        if (proc.exitCode !== 0)
          throw new ExtractionFailedError({
            filepath: archivePath,
            // NO-BUN: use proc.stderrText() instead of Bun.readableStreamToText
            // // stderr: await Bun.readableStreamToText(proc.stderr),
            stderr: await proc.stderrText(),
          })
      }
      await fs.unlink(archivePath)
      if (process.platform !== "win32") await fs.chmod(filepath, 0o755)
    }

    return {
      filepath,
    }
  })

  export async function filepath() {
    const { filepath } = await state()
    return filepath
  }
}
