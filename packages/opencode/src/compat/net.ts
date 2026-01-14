/**
 * Bun network polyfill for Node.js
 *
 * Replaces Bun.connect() with net.Socket.
 */

import { Socket } from "net"

interface ConnectOptions {
  hostname: string
  port: number
  socket?: {
    open?: (socket: any) => void
    close?: () => void
    error?: (error: Error) => void
    data?: (data: Buffer) => void
  }
}

export interface BunSocket {
  end(): void
  write(data: string | Buffer): void
  catch(handler: (error: Error) => void): BunSocket
}

/**
 * Create a TCP connection (replaces Bun.connect())
 */
export function connect(options: ConnectOptions): BunSocket {
  const socket = new Socket()

  socket.connect(options.port, options.hostname, () => {
    if (options.socket?.open) {
      options.socket.open(bunSocket)
    }
  })

  socket.on("error", (err) => {
    if (options.socket?.error) {
      options.socket.error(err)
    }
  })

  socket.on("close", () => {
    if (options.socket?.close) {
      options.socket.close()
    }
  })

  socket.on("data", (data) => {
    if (options.socket?.data) {
      options.socket.data(data)
    }
  })

  let errorHandler: ((error: Error) => void) | null = null

  const bunSocket: BunSocket = {
    end() {
      socket.end()
    },
    write(data: string | Buffer) {
      socket.write(data)
    },
    catch(handler: (error: Error) => void): BunSocket {
      errorHandler = handler
      socket.on("error", handler)
      return bunSocket
    },
  }

  return bunSocket
}

/**
 * Check if a port is in use
 */
export function checkPortInUse(hostname: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket()
    socket.setTimeout(1000)
    socket.once("connect", () => {
      socket.destroy()
      resolve(true)
    })
    socket.once("error", () => resolve(false))
    socket.once("timeout", () => {
      socket.destroy()
      resolve(false)
    })
    socket.connect(port, hostname)
  })
}
