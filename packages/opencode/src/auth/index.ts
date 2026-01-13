import path from "path"
import { Global } from "../global"
import fs from "fs/promises"
import { z } from "zod"
// NO-BUN: replaced Bun.file/Bun.write with compat/file
import { file, write } from "../compat/file"

export namespace Auth {
  export const Oauth = z.object({
    type: z.literal("oauth"),
    refresh: z.string(),
    access: z.string(),
    expires: z.number(),
  })

  export const Api = z.object({
    type: z.literal("api"),
    key: z.string(),
  })

  export const Info = z.discriminatedUnion("type", [Oauth, Api])
  export type Info = z.infer<typeof Info>

  const filepath = path.join(Global.Path.data, "auth.json")

  export async function get(providerID: string) {
    // NO-BUN: replaced Bun.file().json() with file().text() + JSON.parse
    // // const file = Bun.file(filepath)
    // // return file.json().catch(() => ({})).then((x) => x[providerID] as Info | undefined)
    const f = file(filepath)
    return f
      .text()
      .then((text) => JSON.parse(text))
      .catch(() => ({}))
      .then((x) => x[providerID] as Info | undefined)
  }

  export async function all(): Promise<Record<string, Info>> {
    // NO-BUN: replaced Bun.file().json() with file().text() + JSON.parse
    // // const file = Bun.file(filepath)
    // // return file.json().catch(() => ({}))
    const f = file(filepath)
    return f
      .text()
      .then((text) => JSON.parse(text))
      .catch(() => ({}))
  }

  export async function set(key: string, info: Info) {
    // NO-BUN: replaced Bun.file/Bun.write with compat/file
    // // const file = Bun.file(filepath)
    // // await Bun.write(file, JSON.stringify({ ...data, [key]: info }, null, 2))
    const f = file(filepath)
    const data = await all()
    await write(f, JSON.stringify({ ...data, [key]: info }, null, 2))
    await fs.chmod(f.name!, 0o600)
  }

  export async function remove(key: string) {
    // NO-BUN: replaced Bun.file/Bun.write with compat/file
    // // const file = Bun.file(filepath)
    // // await Bun.write(file, JSON.stringify(data, null, 2))
    const f = file(filepath)
    const data = await all()
    delete data[key]
    await write(f, JSON.stringify(data, null, 2))
    await fs.chmod(f.name!, 0o600)
  }
}
