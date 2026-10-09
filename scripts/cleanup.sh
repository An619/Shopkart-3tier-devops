#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
read -p "Wipe volume? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  docker compose down -v
else
  docker compose down
fi
docker ps -a | grep shopkart || echo "none"