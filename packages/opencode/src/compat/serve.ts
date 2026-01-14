/**
 * Bun HTTP server polyfill for Node.js
 *
 * Replaces Bun.serve() with @hono/node-server.
 */

import { serve as honoServe } from "@hono/node-server"
import type { Hono } from "hono"
import type { Server as NodeServer } from "node:http"

export interface Server {
  port: number
  hostname: string
  url: string
  stop(): void
}

interface ServeOptions {
  port?: number
  hostname?: string
  fetch: (request: Request) => Response | Promise<Response>
}

/**
 * Start an HTTP server (replaces Bun.serve())
 *
 * Note: This returns a Promise that resolves when the server is listening.
 * Bun.serve() is synchronous, so call sites may need to await this.
 */
export function serve(options: ServeOptions): Promise<Server>
export function serve(app: Hono, options?: { port?: number; hostname?: string }): Promise<Server>
export function serve(
  appOrOptions: Hono | ServeOptions,
  maybeOptions?: { port?: number; hostname?: string }
): Promise<Server> {
  return new Promise((resolve) => {
    let fetch: (request: Request) => Response | Promise<Response>
    let port: number
    let hostname: string

    if ("fetch" in appOrOptions) {
      // ServeOptions form
      fetch = appOrOptions.fetch
      port = appOrOptions.port ?? 0
      hostname = appOrOptions.hostname ?? "127.0.0.1"
    } else {
      // Hono app form
      fetch = appOrOptions.fetch.bind(appOrOptions)
      port = maybeOptions?.port ?? 0
      hostname = maybeOptions?.hostname ?? "127.0.0.1"
    }

    const nodeServer = honoServe(
      {
        fetch,
        port,
        hostname,
      },
      (info) => {
        const actualPort = info.port
        const actualHost = info.address
        resolve({
          port: actualPort,
          hostname: actualHost,
          url: `http://${actualHost}:${actualPort}`,
          stop() {
            nodeServer.close()
          },
        })
      }
    )
  })
}
