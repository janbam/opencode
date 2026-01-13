import { Global } from "../global"
import { lazy } from "../util/lazy"
import path from "path"
// NO-BUN: replaced Bun.file/Bun.write with compat/file
import { file, write } from "../compat/file"

export const AuthCopilot = lazy(async () => {
  // NO-BUN: replaced Bun.file/Bun.write with compat layer
  // // const file = Bun.file(path.join(Global.Path.state, "plugin", "copilot.ts"))
  // // .then((x) => Bun.write(file, x))
  // // if (!file.exists()) {
  const f = file(path.join(Global.Path.state, "plugin", "copilot.ts"))
  const response = fetch("https://raw.githubusercontent.com/sst/opencode-github-copilot/refs/heads/main/auth.ts")
    .then((x) => write(f, x))
    .then(() => true)
    .catch(() => false)

  if (!(await f.exists())) {
    const worked = await response
    if (!worked) return
  }
  const result = await import(f.name!).catch(() => {})
  if (!result) return
  return result.AuthCopilot
})
