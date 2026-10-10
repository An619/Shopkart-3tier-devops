#!/usr/bin/env bash
# Deploy ShopKart to EKS via Helm.
# Requires: aws CLI configured, kubectl, helm
set -e

cd "$(dirname "$0")/.."

REGION="${AWS_REGION:-us-east-1}"
CLUSTER="${EKS_CLUSTER_NAME:-shopkart-eks}"
NAMESPACE="${NAMESPACE:-shopkart}"
RELEASE="${RELEASE_NAME:-shopkart}"
DOCKERHUB_USER="${DOCKERHUB_USER:-your_dockerhub_user}"
TAG="${IMAGE_TAG:-latest}"

echo "=== Configuring kubeconfig ==="
aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER"

echo ""
echo "=== Current nodes ==="
kubectl get nodes

echo ""
echo "=== Installing / upgrading Helm release ==="
helm upgrade --install "$RELEASE" ./helm/shopkart \
  --namespace "$NAMESPACE" --create-namespace \
  --set backend.image.repository=${DOCKERHUB_USER}/shopkart-backend \
  --set backend.image.tag=${TAG} \
  --set frontend.image.repository=${DOCKERHUB_USER}/shopkart-frontend \
  --set frontend.image.tag=${TAG} \
  --wait --timeout 10m

echo ""
echo "=== Pods ==="
kubectl get pods -n "$NAMESPACE"

echo ""
echo "=== Services ==="
kubectl get svc -n "$NAMESPACE"

echo ""
echo "=== Ingress ==="
kubectl get ingress -n "$NAMESPACE"
