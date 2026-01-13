import { App } from "../app/app"
import { Ripgrep } from "../file/ripgrep"
import { Global } from "../global"
import { Filesystem } from "../util/filesystem"
import { Config } from "../config/config"
import path from "path"
import os from "os"
// NO-BUN: replaced Bun.file with compat/file
import { file, loadText } from "../compat"
// NO-BUN: replaced Bun's .txt import with loadText
// // import PROMPT_ANTHROPIC from "./prompt/anthropic.txt"
// // import PROMPT_BEAST from "./prompt/beast.txt"
// // import PROMPT_ANTHROPIC_SPOOF from "./prompt/anthropic_spoof.txt"
// // import PROMPT_SUMMARIZE from "./prompt/summarize.txt"
// // import PROMPT_TITLE from "./prompt/title.txt"
const PROMPT_ANTHROPIC = loadText("./prompt/anthropic.txt", import.meta.url)
const PROMPT_BEAST = loadText("./prompt/beast.txt", import.meta.url)
const PROMPT_ANTHROPIC_SPOOF = loadText("./prompt/anthropic_spoof.txt", import.meta.url)
const PROMPT_SUMMARIZE = loadText("./prompt/summarize.txt", import.meta.url)
const PROMPT_TITLE = loadText("./prompt/title.txt", import.meta.url)

export namespace SystemPrompt {
  export function provider(providerID: string, modelID: string) {
    if (providerID === "anthropic") return [PROMPT_ANTHROPIC_SPOOF.trim(), PROMPT_ANTHROPIC]
    if (modelID.includes("gpt-") || modelID.includes("o1") || modelID.includes("o3")) return [PROMPT_BEAST]
    return [PROMPT_ANTHROPIC]
  }

  export async function environment() {
    const app = App.info()
    return [
      [
        `Here is some useful information about the environment you are running in:`,
        `<env>`,
        `  Working directory: ${app.path.cwd}`,
        `  Is directory a git repo: ${app.git ? "yes" : "no"}`,
        `  Platform: ${process.platform}`,
        `  Today's date: ${new Date().toDateString()}`,
        `</env>`,
        `<project>`,
        `  ${
          app.git
            ? await Ripgrep.tree({
                cwd: app.path.cwd,
                limit: 200,
              })
            : ""
        }`,
        `</project>`,
      ].join("\n"),
    ]
  }

  const CUSTOM_FILES = [
    "AGENTS.md",
    "CLAUDE.md",
    "CONTEXT.md", // deprecated
  ]

  export async function custom() {
    const { cwd, root } = App.info().path
    const config = await Config.get()
    const found = []
    // NO-BUN: replaced Bun.file(x).text() with file(x).text()
    // // found.push(...matches.map((x) => Bun.file(x).text()))
    for (const item of CUSTOM_FILES) {
      const matches = await Filesystem.findUp(item, cwd, root)
      found.push(...matches.map((x) => file(x).text()))
    }
    // NO-BUN: replaced Bun.file().text() with file().text()
    // // Bun.file(path.join(Global.Path.config, "AGENTS.md")).text().catch(() => ""),
    // // Bun.file(path.join(os.homedir(), ".claude", "CLAUDE.md")).text().catch(() => ""),
    found.push(
      file(path.join(Global.Path.config, "AGENTS.md"))
        .text()
        .catch(() => ""),
    )
    found.push(
      file(path.join(os.homedir(), ".claude", "CLAUDE.md"))
        .text()
        .catch(() => ""),
    )

    if (config.instructions) {
      for (const instruction of config.instructions) {
        try {
          const matches = await Filesystem.globUp(instruction, cwd, root)
          // NO-BUN: replaced Bun.file(x).text() with file(x).text()
          // // found.push(...matches.map((x) => Bun.file(x).text()))
          found.push(...matches.map((x) => file(x).text()))
        } catch {
          continue // Skip invalid glob patterns
        }
      }
    }

    return Promise.all(found).then((result) => result.filter(Boolean))
  }

  export function summarize(providerID: string) {
    switch (providerID) {
      case "anthropic":
        return [PROMPT_ANTHROPIC_SPOOF.trim(), PROMPT_SUMMARIZE]
      default:
        return [PROMPT_SUMMARIZE]
    }
  }

  export function title(providerID: string) {
    switch (providerID) {
      case "anthropic":
        return [PROMPT_ANTHROPIC_SPOOF.trim(), PROMPT_TITLE]
      default:
        return [PROMPT_TITLE]
    }
  }
}
