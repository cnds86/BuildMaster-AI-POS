#!/bin/bash
# ─────────────────────────────────────────────────────
# MHX-POS — Development Runner
# Frontend: http://localhost:5176
# Backend:  http://localhost:3006
# ─────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env if exists
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

# Find bun — check known absolute paths first, then PATH
BUN=""
for p in \
  /home/cnds86/.cache/opencode/node_modules/@oven/bun-linux-x64-baseline/bin/bun \
  /home/cnds86/.cache/opencode/node_modules/@oven/bun-linux-x64-musl/bin/bun \
  "$HOME/.cache/opencode/node_modules/@oven/bun-linux-x64-baseline/bin/bun" \
  "$HOME/.cache/opencode/node_modules/@oven/bun-linux-x64-musl/bin/bun" \
  bun; do
  if [ -x "$p" ]; then
    BUN="$p"
    break
  fi
done

if [ -z "$BUN" ]; then
  echo "❌ bun not found. Please install bun: https://bun.sh"
  exit 1
fi

echo "🚀 Starting MHX-POS..."
echo "   Frontend → http://localhost:${VITE_PORT:-5173}"
echo "   Backend  → http://localhost:${PORT:-3006}"
echo "   bun      → $BUN ($($BUN --version))"
echo ""

cd "$SCRIPT_DIR"

exec $BUN --bun run dev
