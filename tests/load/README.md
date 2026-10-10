# Load Testing — ShopKart

This folder is for load testing scripts. The simplest options:

## Option 1 — Apache Bench (ab)

    ab -n 1000 -c 50 http://localhost:5000/api/health

## Option 2 — k6

Install k6: https://k6.io/docs/get-started/installation/

Create `k6-test.js`:

    import http from 'k6/http';
    import { check, sleep } from 'k6';

    export const options = {
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m',  target: 50 },
        { duration: '30s', target: 0  },
      ],
    };

    export default function () {
      const res = http.get('http://localhost:5000/api/products');
      check(res, { 'status 200': (r) => r.status === 200 });
      sleep(1);
    }

Run:

    k6 run k6-test.js

## Option 3 — Locust (Python)

    pip install locust
    locust -f locustfile.py --host http://localhost:5000

## On Kubernetes

Run load generators as ephemeral pods:

    kubectl run -it --rm load-gen --image=busybox -n shopkart -- \
      /bin/sh -c "while true; do wget -q -O- http://shopkart-backend:5000/api/health; done"

Then watch the HPA scale:

    kubectl get hpa -n shopkart -w

## What to Measure

- Requests per second
- p50 / p95 / p99 latency
- Error rate
- Backend CPU / memory
- HPA scaling events

## Baseline Targets

| Metric | Target |
|---|---|
| p95 latency (health) | < 50ms |
| p95 latency (products) | < 200ms |
| Error rate | < 1% |
| Backend CPU at peak | < 70% |
