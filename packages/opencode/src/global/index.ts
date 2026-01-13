import fs from "fs/promises"
import { xdgData, xdgCache, xdgConfig, xdgState } from "xdg-basedir"
import path from "path"
// NO-BUN: replaced Bun.file with compat/file
import { file, write } from "../compat/file"

const app = "opencode"

const data = path.join(xdgData!, app)
const cache = path.join(xdgCache!, app)
const config = path.join(xdgConfig!, app)
const state = path.join(xdgState!, app)

export namespace Global {
  export const Path = {
    data,
    bin: path.join(data, "bin"),
    providers: path.join(config, "providers"),
    cache,
    config,
    state,
  } as const
}

await Promise.all([
  fs.mkdir(Global.Path.data, { recursive: true }),
  fs.mkdir(Global.Path.config, { recursive: true }),
  fs.mkdir(Global.Path.providers, { recursive: true }),
  fs.mkdir(Global.Path.state, { recursive: true }),
])

const CACHE_VERSION = "2"

// NO-BUN: replaced Bun.file().text() with file().text()
// // const version = await Bun.file(path.join(Global.Path.cache, "version")).text().catch(() => "0")
const version = await file(path.join(Global.Path.cache, "version"))
  .text()
  .catch(() => "0")

if (version !== CACHE_VERSION) {
  await fs.rm(Global.Path.cache, { recursive: true, force: true })
  // NO-BUN: replaced Bun.file().write() with write()
  // // await Bun.file(path.join(Global.Path.cache, "version")).write(CACHE_VERSION)
  await write(path.join(Global.Path.cache, "version"), CACHE_VERSION)
}
