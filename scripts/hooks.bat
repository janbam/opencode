@echo off

if not exist ".git" (
    exit /b 0
)

if not exist ".git\hooks" (
    mkdir ".git\hooks"
)

(
    echo #!/bin/sh
    echo pnpm typecheck
) > ".git\hooks\pre-push"

echo ✅ Pre-push hook installed
