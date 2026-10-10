#!/usr/bin/env bash
# Stop the local Docker Compose stack and (optionally) wipe data.
set -e

cd "$(dirname "$0")/.."

read -p "Wipe database volume? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "-> Stopping and removing volumes"
  docker compose down -v
else
  echo "-> Stopping (data preserved)"
  docker compose down
fi

echo ""
echo "-> Remaining ShopKart containers:"
docker ps -a | grep shopkart || echo "  (none)"

echo ""
echo "-> Remaining ShopKart images:"
docker images | grep shopkart || echo "  (none)"
