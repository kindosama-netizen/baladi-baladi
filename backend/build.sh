#!/usr/bin/env bash
set -o errexit

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Install Node (Render Python image does not include it)
NODE_VERSION=20.18.1
if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node ${NODE_VERSION}"
  curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" -o /tmp/node.tar.xz
  mkdir -p "$HOME/.local"
  tar -xJf /tmp/node.tar.xz -C "$HOME/.local"
  export PATH="$HOME/.local/node-v${NODE_VERSION}-linux-x64/bin:$PATH"
fi

echo "==> Node $(node -v) / npm $(npm -v)"

echo "==> Building frontend"
cd "$ROOT/frontend"
npm ci
npm run build

echo "==> Installing backend deps"
cd "$ROOT/backend"
pip install -r requirements.txt

echo "==> Collectstatic + migrate"
python manage.py collectstatic --no-input
python manage.py migrate --no-input

echo "==> Build complete"
