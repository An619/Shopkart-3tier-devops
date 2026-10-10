#!/usr/bin/env bash
# Push ShopKart images to Docker Hub.
# Requires: docker login, DOCKERHUB_USER env var
set -e

cd "$(dirname "$0")/.."

DOCKERHUB_USER="${DOCKERHUB_USER:-your_dockerhub_user}"
TAG="${IMAGE_TAG:-latest}"

echo "=== Pushing to Docker Hub as ${DOCKERHUB_USER} ==="

docker tag shopkart-backend:${TAG}  ${DOCKERHUB_USER}/shopkart-backend:${TAG}
docker tag shopkart-frontend:${TAG} ${DOCKERHUB_USER}/shopkart-frontend:${TAG}

docker push ${DOCKERHUB_USER}/shopkart-backend:${TAG}
docker push ${DOCKERHUB_USER}/shopkart-frontend:${TAG}

echo ""
echo "=== Pushed ==="
echo "  ${DOCKERHUB_USER}/shopkart-backend:${TAG}"
echo "  ${DOCKERHUB_USER}/shopkart-frontend:${TAG}"
