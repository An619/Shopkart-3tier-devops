# Monitoring — ShopKart

Prometheus + Grafana stack for the ShopKart cluster.

## Install kube-prometheus-stack

    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update

    helm install kube-prom prometheus-community/kube-prometheus-stack \
      -n monitoring --create-namespace \
      -f monitoring/values-prometheus.yaml

## Verify

    kubectl get pods -n monitoring
    kubectl get svc -n monitoring

## Access Grafana

    kubectl port-forward -n monitoring svc/kube-prom-grafana 3000:80

Open http://localhost:3000 — default login `admin` / `prom-operator`.

## What Is Monitored

- Kubernetes nodes (CPU, memory, disk, network)
- All pods and containers
- Deployments, StatefulSets, HPAs
- ShopKart backend custom metrics:
  - `shopkart_http_requests_total`
  - `shopkart_http_request_duration_seconds`
  - `shopkart_orders_created_total`
  - `shopkart_cart_adds_total`

## Dashboards

| File | Description |
|---|---|
| `dashboards/shopkart-backend.json` | Backend request rate, latency, custom metrics |
| `dashboards/shopkart-cluster.json` | Cluster-wide CPU/memory/pods |
| `dashboards/shopkart-namespace.json` | ShopKart namespace focus |

Import via Grafana UI: Dashboards -> Import -> Upload JSON.

## Prometheus Scrape

The backend exposes `/metrics` on port 5000. To scrape it, apply this ServiceMonitor:

    kubectl apply -f - <<'YAML'
    apiVersion: monitoring.coreos.com/v1
    kind: ServiceMonitor
    metadata:
      name: shopkart-backend
      namespace: monitoring
      labels:
        release: kube-prom
    spec:
      namespaceSelector:
        matchNames: [shopkart]
      selector:
        matchLabels:
          app: shopkart-backend
      endpoints:
        - port: http
          path: /metrics
          interval: 15s
    YAML

## Alerts

Common alerts to enable:

- Pod CrashLoopBackOff > 5m
- Node not ready > 5m
- Backend 5xx rate > 5%
- Backend p95 latency > 1s
- Postgres disk > 80%
