import { z } from "zod"
import { Tool } from "./tool"
import { EditTool } from "./edit"
// NO-BUN: replaced Bun's .txt import with loadText
// // import DESCRIPTION from "./multiedit.txt"
import { loadText } from "../compat"
const DESCRIPTION = loadText("./multiedit.txt", import.meta.url)
import path from "path"
import { App } from "../app/app"

export const MultiEditTool = Tool.define({
  id: "multiedit",
  description: DESCRIPTION,
  parameters: z.object({
    filePath: z.string().describe("The absolute path to the file to modify"),
    edits: z.array(EditTool.parameters).describe("Array of edit operations to perform sequentially on the file"),
  }),
  async execute(params, ctx) {
    const results = []
    for (const [, edit] of params.edits.entries()) {
      const result = await EditTool.execute(
        {
          filePath: params.filePath,
          oldString: edit.oldString,
          newString: edit.newString,
          replaceAll: edit.replaceAll,
        },
        ctx,
      )
      results.push(result)
    }
    const app = App.info()
    return {
      title: path.relative(app.path.root, params.filePath),
      metadata: {
        results: results.map((r) => r.metadata),
      },
      output: results.at(-1)!.output,
    }
  },
})
