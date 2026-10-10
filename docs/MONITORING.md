# Monitoring — ShopKart

Prometheus + Grafana via the kube-prometheus-stack Helm chart.

## Install

    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update

    helm install kube-prom prometheus-community/kube-prometheus-stack \
      -n monitoring --create-namespace \
      -f monitoring/values-prometheus.yaml

## Access Grafana

    kubectl port-forward -n monitoring svc/kube-prom-grafana 3000:80

http://localhost:3000 — login `admin` / `prom-operator`.

## Access Prometheus

    kubectl port-forward -n monitoring svc/kube-prom-kube-prometheus-prometheus 9090:9090

http://localhost:9090.

## Metrics Collected

From `node-exporter`:

- `node_cpu_seconds_total`
- `node_memory_*`
- `node_filesystem_*`
- `node_network_*`

From `kube-state-metrics`:

- `kube_pod_info`
- `kube_deployment_status_replicas_available`
- `kube_horizontalpodautoscaler_*`

From ShopKart backend (custom Prometheus client):

- `shopkart_http_requests_total{method,route,status}`
- `shopkart_http_request_duration_seconds_bucket{...}`
- `shopkart_orders_created_total`
- `shopkart_cart_adds_total`
- `shopkart_backend_process_*` (default node metrics)

## Scrape the Backend

Apply a ServiceMonitor so Prometheus scrapes `/metrics`:

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

## Dashboards

Import from `monitoring/dashboards/`:

- `shopkart-backend.json` — request rate, latency, custom counters
- `shopkart-cluster.json` — cluster CPU/memory
- `shopkart-namespace.json` — shopkart-specific pods and HPA

Import via Grafana UI: Dashboards > Import > Upload JSON.

## Alerts

Enable in Prometheus rules or Grafana alerts:

- Pod CrashLoopBackOff > 5 min
- Node not ready > 5 min
- Backend 5xx rate > 5%
- Backend p95 latency > 1s
- Postgres PVC > 80% full

## Verify

    kubectl get pods -n monitoring
    kubectl get servicemonitors -A
    kubectl get prometheusrules -n monitoring
