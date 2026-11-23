#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/ammardoma/ImpulseShell.git"
INSTALL_DIR="${IMPULSE_DIR:-$HOME/.local/share/ImpulseShell}"

if ! command -v git >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
  echo "Please install git and Node.js (v18+) first." >&2
  exit 1
fi

if [ -d "$INSTALL_DIR/.git" ]; then
  git -C "$INSTALL_DIR" pull --ff-only
else
  git clone --depth=1 "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
npm install --legacy-peer-deps
npm run build
echo "Installed ImpulseShell! Starting on http://localhost:3000 ..."
npm run dev
