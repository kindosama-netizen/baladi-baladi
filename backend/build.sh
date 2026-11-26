#!/usr/bin/env bash
set -o errexit

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

echo "==> Installing backend deps"
pip install -r requirements.txt

if [ ! -f "$ROOT/frontend/dist/index.html" ]; then
  echo "ERROR: frontend/dist missing. Build locally with: cd frontend && npm run build"
  exit 1
fi

echo "==> Using prebuilt frontend/dist"
echo "==> Collectstatic + migrate"
python manage.py collectstatic --no-input
python manage.py migrate --no-input

echo "==> Build complete"
