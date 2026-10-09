#!/bin/sh
# ============================================================
# ShopKart — Postgres init helper
# ============================================================
# The postgres:15-alpine image automatically runs any *.sql file
# placed under /docker-entrypoint-initdb.d/ on first startup.
# This script is a manual reference for running migrations
# against an already-initialized database.
#
# Usage:
#   docker compose exec postgres /docker/init-db.sh
# ============================================================

set -e

echo "Applying schema..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -f /docker-entrypoint-initdb.d/01-schema.sql

echo "Applying seed data..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -f /docker-entrypoint-initdb.d/02-seed.sql

echo "Done."
