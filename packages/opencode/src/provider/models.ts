import { Global } from "../global"
import { Log } from "../util/log"
import path from "path"
// NO-BUN: Import z from centralized module to ensure openapi extension is applied
import { z } from "../util/zod"
// NO-BUN: removed Bun macro import - now a regular async function call at runtime
// // import { data } from "./models-macro" with { type: "macro" }
import { data } from "./models-macro"
// NO-BUN: replaced Bun.file/Bun.write with compat/file
import { file, write } from "../compat/file"

export namespace ModelsDev {
  const log = Log.create({ service: "models.dev" })
  const filepath = path.join(Global.Path.cache, "models.json")

  export const Model = z
    .object({
      id: z.string(),
      name: z.string(),
      release_date: z.string(),
      attachment: z.boolean(),
      reasoning: z.boolean(),
      temperature: z.boolean(),
      tool_call: z.boolean(),
      cost: z.object({
        input: z.number(),
        output: z.number(),
        cache_read: z.number().optional(),
        cache_write: z.number().optional(),
      }),
      limit: z.object({
        context: z.number(),
        output: z.number(),
      }),
      options: z.record(z.any()),
    })
    .openapi({
      ref: "Model",
    })
  export type Model = z.infer<typeof Model>

  export const Provider = z
    .object({
      api: z.string().optional(),
      name: z.string(),
      env: z.array(z.string()),
      id: z.string(),
      npm: z.string().optional(),
      models: z.record(Model),
    })
    .openapi({
      ref: "Provider",
    })

  export type Provider = z.infer<typeof Provider>

  export async function get() {
    // NO-BUN: replaced Bun.file().json() with file().text() + JSON.parse
    // // const file = Bun.file(filepath)
    // // const result = await file.json().catch(() => {})
    const f = file(filepath)
    const result = await f
      .text()
      .then((t) => JSON.parse(t))
      .catch(() => {})
    if (result) {
      refresh()
      return result as Record<string, Provider>
    }
    refresh()
    const json = await data()
    return JSON.parse(json) as Record<string, Provider>
  }

  async function refresh() {
    // NO-BUN: replaced Bun.file/Bun.write with compat/file
    // // const file = Bun.file(filepath)
    // // if (result && result.ok) await Bun.write(file, result)
    log.info("refreshing")
    const result = await fetch("https://models.dev/api.json").catch(() => {})
    if (result && result.ok) await write(filepath, result)
  }
}
