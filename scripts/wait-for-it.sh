#!/usr/bin/env bash
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
echo "Waiting for $HOST:$PORT..."
start=$(date +%s)
while ! (echo > "/dev/tcp/$HOST/$PORT") >/dev/null 2>&1; do
  now=$(date +%s)
  if (( now - start >= TIMEOUT )); then
    echo "Timeout" >&2
    exit 1
  fi
  sleep 1
done
echo "$HOST:$PORT is up."