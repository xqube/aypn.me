#!/bin/bash
# ─────────────────────────────────────
# Deploy script for aypn.me
# Run on VPS: bash deploy.sh
# ─────────────────────────────────────

set -e  # Exit immediately on any error

PROJECT_DIR="/home/xqube/aypn.me"
APP_NAME="aypn.me"

cd "$PROJECT_DIR"

echo "─────────────────────────────────────"
echo "Deploying $APP_NAME"
echo "─────────────────────────────────────"

echo "→ Pulling latest code..."
git pull

echo "→ Installing dependencies..."
npm ci

echo "→ Building content + CSS..."
npm run build

echo "→ Pruning dev dependencies..."
npm prune --omit=dev

echo "→ Restarting PM2..."
pm2 restart "$APP_NAME"

echo "─────────────────────────────────────"
echo "✓ Deployed successfully"
echo "─────────────────────────────────────"
