# Archived Migration Documents

These files document the **legacy file-by-file migration** approach used on the `no-bun` branch (July 2025 fork).

This approach successfully migrated the old codebase but became obsolete when we discovered we were 5,731 commits behind upstream.

## Files

- `PROGRESS-legacy-migration.md` — Session log and phase tracking for the file-by-file migration
- `CLAUDE-legacy-migration.md` — Instructions for the file-by-file migration approach

## Why Archived

The polyfill approach (see `dev_docs/polyfill-strategy.md`) replaces the file-by-file migration. The polyfill:
- Keeps upstream code unchanged
- Makes future upstream syncs trivial
- Reuses 95% of our compat layer work

## Reference Value

These documents are still useful for:
- Understanding the compat layer patterns we developed
- Seeing which Bun APIs we already solved
- Historical context on the migration journey
