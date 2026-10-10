# Kubernetes Manifests — ShopKart

The `k8s/` folder contains raw manifests. Use `kubectl apply -k k8s/` (kustomize) or apply files individually.

## Objects

| File | Kind | Purpose |
|---|---|---|
| namespace.yaml | Namespace | shopkart |
| configmap.yaml | ConfigMap | Non-secret env |
| secret.yaml | Secret | DB password + JWT |
| database/service.yaml | Service (headless) | Postgres DNS |
| database/statefulset.yaml | StatefulSet | Postgres with PVC |
| backend/service.yaml | Service (ClusterIP) | Backend on 5000 |
| backend/deployment.yaml | Deployment | 2 replicas |
| frontend/service.yaml | Service (ClusterIP) | Frontend on 80 |
| frontend/deployment.yaml | Deployment | 2 replicas |
| ingress.yaml | Ingress | NGINX, routes / and /api |
| hpa.yaml | HorizontalPodAutoscaler | Backend autoscale |

## Apply Everything

    kubectl apply -k k8s/

Or file by file:

    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secret.yaml
    kubectl apply -f k8s/database/
    kubectl apply -f k8s/backend/
    kubectl apply -f k8s/frontend/
    kubectl apply -f k8s/ingress.yaml
    kubectl apply -f k8s/hpa.yaml

## Verify

    kubectl get all -n shopkart
    kubectl get ingress -n shopkart
    kubectl get pvc -n shopkart
    kubectl get hpa -n shopkart

## Probes

Backend: `/api/health` on port 5000.
Frontend: `/healthz` on port 80.
Startup probes allow slow first boots.

## Resources

Backend requests 100m CPU / 128Mi, limits 500m / 512Mi.
Frontend requests 50m / 64Mi, limits 300m / 256Mi.
Postgres requests 100m / 256Mi, limits 500m / 1Gi.

## Ingress

Routes `/api` and `/metrics` to backend, `/` to frontend, host `shopkart.local`.

Test locally:

    echo "127.0.0.1 shopkart.local" | sudo tee -a /etc/hosts
    curl -H "Host: shopkart.local" http://localhost/api/health

## Cleanup

    kubectl delete -k k8s/
    kubectl delete namespace shopkart
