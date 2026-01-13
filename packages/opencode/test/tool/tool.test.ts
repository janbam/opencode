// NO-BUN: Migrated from bun:test to vitest
import { describe, expect, test } from "vitest"
import { App } from "../../src/app/app"
import { GlobTool } from "../../src/tool/glob"
import { ListTool } from "../../src/tool/ls"

const ctx = {
  sessionID: "test",
  messageID: "",
  abort: AbortSignal.any([]),
  metadata: () => {},
}
describe("tool.glob", () => {
  test("truncate", async () => {
    // Search from the repo root's node_modules which has thousands of files
    const repoRoot = process.cwd().replace(/\/packages\/opencode$/, "")
    await App.provide({ cwd: repoRoot }, async () => {
      let result = await GlobTool.execute(
        {
          pattern: "**/*",
          path: "node_modules",
        },
        ctx,
      )
      expect(result.metadata.truncated).toBe(true)
    })
  })
  test("basic", async () => {
    await App.provide({ cwd: process.cwd() }, async () => {
      let result = await GlobTool.execute(
        {
          pattern: "*.json",
          path: undefined,
        },
        ctx,
      )
      expect(result.metadata).toMatchObject({
        truncated: false,
        count: 2, // package.json and tsconfig.json
      })
    })
  })
})

describe("tool.ls", () => {
  test("basic", async () => {
    const result = await App.provide({ cwd: process.cwd() }, async () => {
      return await ListTool.execute({ path: "./example", ignore: [".git"] }, ctx)
    })
    expect(result.output).toMatchSnapshot()
  })
})
