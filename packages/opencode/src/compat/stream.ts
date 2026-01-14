/**
 * Bun stream utilities polyfill for Node.js
 *
 * Replaces Bun's readableStreamToText with Node.js equivalents.
 */

import { text as streamText } from "node:stream/consumers"
import type { Readable } from "node:stream"

/**
 * Convert a readable stream to text (replaces Bun's readableStreamToText)
 */
export async function readableStreamToText(stream: ReadableStream<Uint8Array> | Readable | null): Promise<string> {
  if (!stream) return ""

  // Handle Web ReadableStream
  if ("getReader" in stream) {
    return new Response(stream).text()
  }

  // Handle Node.js Readable stream
  return streamText(stream)
}

/**
 * Convert a readable stream to Buffer
 */
export async function readableStreamToBuffer(stream: ReadableStream<Uint8Array> | Readable | null): Promise<Buffer> {
  if (!stream) return Buffer.alloc(0)

  // Handle Web ReadableStream
  if ("getReader" in stream) {
    const response = new Response(stream)
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  // Handle Node.js Readable stream
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
