# opencode

AI coding agent for the terminal.

## Requirements

- Node.js 22+
- pnpm
- Go 1.21+ (for TUI)

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Runs with tsx watch mode. TUI is launched via `go run` automatically.

## Build

```bash
pnpm build
```

Builds the Go TUI binary and creates a launcher script in `dist/`.

## Run (Production)

```bash
./dist/opencode
```

## Test

```bash
pnpm test
```

## Architecture

- **TypeScript CLI**: `src/` — runs via tsx (no bundling)
- **Go TUI**: `../tui/` — compiled binary in `dist/tui`
- **Compat Layer**: `src/compat/` — Node.js replacements for Bun APIs

See `dev_docs/migration-architecture.md` for details.
