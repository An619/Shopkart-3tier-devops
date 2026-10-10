#!/usr/bin/env bash
# Wait until a host:port accepts TCP connections.
# Usage: ./scripts/wait-for-it.sh host:port [-t timeout]
set -e

TIMEOUT=30
HOST=""
PORT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t) TIMEOUT="$2"; shift 2 ;;
    *:*) HOST="${1%%:*}"; PORT="${1##*:}"; shift ;;
    *) shift ;;
  esac
done

if [[ -z "$HOST" || -z "$PORT" ]]; then
  echo "usage: $0 host:port [-t timeout]" >&2
  exit 1
fi

echo "Waiting for $HOST:$PORT (timeout ${TIMEOUT}s)..."
start=$(date +%s)
while ! (echo > "/dev/tcp/$HOST/$PORT") >/dev/null 2>&1; do
  now=$(date +%s)
  if (( now - start >= TIMEOUT )); then
    echo "Timeout waiting for $HOST:$PORT" >&2
    exit 1
  fi
  sleep 1
done

echo "$HOST:$PORT is up."
