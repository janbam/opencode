/**
 * Type declarations for text file imports
 *
 * Bun supports importing .txt files as strings.
 * For Node.js, we need bundler support (tsx/esbuild) to actually resolve these.
 */

declare module "*.txt" {
  const content: string
  export default content
}
