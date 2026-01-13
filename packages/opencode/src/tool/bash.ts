import { z } from "zod"
import { Tool } from "./tool"
// NO-BUN: replaced Bun's .txt import with loadText
// // import DESCRIPTION from "./bash.txt"
import { spawn, loadText } from "../compat"
const DESCRIPTION = loadText("./bash.txt", import.meta.url)
import { App } from "../app/app"

const MAX_OUTPUT_LENGTH = 30000
const DEFAULT_TIMEOUT = 1 * 60 * 1000
const MAX_TIMEOUT = 10 * 60 * 1000

export const BashTool = Tool.define({
  id: "bash",
  description: DESCRIPTION,
  parameters: z.object({
    command: z.string().describe("The command to execute"),
    timeout: z.number().min(0).max(MAX_TIMEOUT).describe("Optional timeout in milliseconds").optional(),
    description: z
      .string()
      .describe(
        "Clear, concise description of what this command does in 5-10 words. Examples:\nInput: ls\nOutput: Lists files in current directory\n\nInput: git status\nOutput: Shows working tree status\n\nInput: npm install\nOutput: Installs package dependencies\n\nInput: mkdir foo\nOutput: Creates directory 'foo'",
      ),
  }),
  async execute(params, ctx) {
    const timeout = Math.min(params.timeout ?? DEFAULT_TIMEOUT, MAX_TIMEOUT)

    // NO-BUN: replaced Bun.spawn with compat layer spawn
    // // const process = Bun.spawn({
    // //   cmd: ["bash", "-c", params.command],
    // //   cwd: App.info().path.cwd,
    // //   maxBuffer: MAX_OUTPUT_LENGTH,
    // //   signal: ctx.abort,
    // //   timeout: timeout,
    // //   stdout: "pipe",
    // //   stderr: "pipe",
    // // })
    const proc = spawn({
      cmd: ["bash", "-c", params.command],
      cwd: App.info().path.cwd,
      maxBuffer: MAX_OUTPUT_LENGTH,
      signal: ctx.abort,
      timeout: timeout,
      stdout: "pipe",
      stderr: "pipe",
    })
    // NO-BUN: use proc.text() and proc.stderrText() instead of Response
    // // await process.exited
    // // const stdout = await new Response(process.stdout).text()
    // // const stderr = await new Response(process.stderr).text()
    await proc.exited
    const stdout = await proc.text()
    const stderr = await proc.stderrText()

    return {
      title: params.command,
      metadata: {
        stderr,
        stdout,
        exit: proc.exitCode,
        description: params.description,
      },
      output: [`<stdout>`, stdout ?? "", `</stdout>`, `<stderr>`, stderr ?? "", `</stderr>`].join("\n"),
    }
  },
})
