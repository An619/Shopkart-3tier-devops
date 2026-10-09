#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
TAG="${IMAGE_TAG:-latest}"
docker build -t "shopkart-backend:${TAG}" ./backend
docker build -t "shopkart-frontend:${TAG}" ./frontend
docker images | grep shopkart