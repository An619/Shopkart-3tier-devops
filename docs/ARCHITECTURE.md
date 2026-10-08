# ShopKart — Architecture Deep Dive

This document explains the *why* behind every architectural decision in ShopKart. It's written so you can talk through each layer in an interview without hand-waving.

---

## 1. The Three Tiers

| Tier | Component | Runs As | Talks To |
|---|---|---|---|
| Presentation | React SPA served by Nginx | Static container | Backend REST API |
| Application | Node.js + Express | Stateless container | PostgreSQL |
| Data | PostgreSQL | Stateful container (StatefulSet) | — |

**Rule:** the frontend never talks to PostgreSQL directly. It only knows the backend's REST API URL. This is what makes it a *3-tier* app (not a client-server app).

---

## 2. Port & Name Contract

This contract is enforced across **every** phase:

| Item | Value |
|---|---|
| Frontend port | `80` |
| Backend port | `5000` |
| Postgres port | `5432` |
| Namespace | `shopkart` |
| Frontend Service | `shopkart-frontend` |
| Backend Service | `shopkart-backend` |
| Postgres Service | `shopkart-postgres` |
| Frontend image | `shopkart-frontend` |
| Backend image | `shopkart-backend` |
| DB name | `shopkart` |
| DB user | `shopkart_user` |
| Health endpoint | `/api/health` |
| Metrics endpoint | `/metrics` |

---

## 3. Request Flow (single page load)

```
1.  Browser → Ingress → Frontend Pod (Nginx)
2.  Nginx returns index.html + JS bundle
3.  JS bundle calls GET /api/products
4.  Nginx (in the frontend pod) proxies /api/* → shopkart-backend:5000
5.  Backend calls Postgres via pg pool
6.  Postgres returns rows
7.  Backend returns JSON
8.  Nginx returns JSON to browser
9.  React renders ProductGrid
```

**Why nginx proxies `/api`?** So the browser only ever talks to *one origin*. That removes CORS entirely from production. (CORS is still enabled on the backend for local dev.)

---

## 4. Why These Specific Choices

### React + Vite over Next.js
- SPA is enough for e-commerce with a REST backend.
- No server-side rendering requirement.
- Vite build is extremely fast, output is tiny.
- Removes a Node process from the frontend tier → simpler K8s deployment.

### Node/Express over NestJS
- Same language as frontend → fewer context switches.
- Express is unopinionated → easy to demonstrate JWT, middleware, error handling manually.
- Container is small (~120 MB Alpine).

### PostgreSQL over MySQL
- Stricter type system, better JSON support (useful for product attributes later).
- `ON CONFLICT DO NOTHING` in seed data.
- StatefulSet + PVC pattern is well-documented.

### JWT over sessions
- Stateless → backend pods can be scaled horizontally with zero session affinity.
- HPA can add pods without breaking logged-in users.

### Multi-stage Docker builds
- Build stage has 300 MB of node_modules; runtime stage has ~80 MB.
- Smaller images = faster pulls on Killercoda and EKS.
- Fewer CVEs because dev deps never ship.

### StatefulSet for Postgres (not Deployment)
- Stable DNS: `shopkart-postgres-0.shopkart-postgres.shopkart.svc.cluster.local`
- PVC template → each replica gets its own disk.
- Ordered startup ensures the DB is up before backend pods try to connect.

### Helm over raw kubectl
- One chart → three environments (dev / prod / local).
- `helm rollback` gives an instant "undo deploy" story.
- Values files keep environment-specific config out of templates.

### Terraform for EKS
- Declarative → destroy is safe and repeatable.
- State file prevents drift.
- `terraform plan` doubles as a change review artifact.

---

## 5. Configuration Matrix

| Environment | Frontend → Backend | DB host | Ingress |
|---|---|---|---|
| Local dev | `http://localhost:5000` (Vite proxy) | `localhost` | none |
| Docker Compose | `http://backend:5000` (nginx) | `postgres` | none |
| Killercoda | `http://shopkart-backend:5000` | `shopkart-postgres` | NGINX Ingress |
| EKS dev | Same as Killercoda | Same | AWS ALB |
| EKS prod | Same | Same (or RDS later) | ALB + ACM |

**No application code changes between environments** — only values/annotations.

---

## 6. State & Data Model Summary

Full schema in `database/schema.sql`. Key tables:

- `users`, `roles`
- `categories`, `products`, `product_categories`
- `cart`, `cart_items`
- `wishlist`, `wishlist_items`
- `addresses`
- `orders`, `order_items`
- `payments`
- `reviews`

Every table has `created_at` / `updated_at` timestamps and FK constraints.

---

## 7. Scaling Story

| Load | Action |
|---|---|
| Small | 1 backend pod, HPA min=1 |
| Medium | HPA scales backend to N based on CPU > 70% |
| Large | Postgres → RDS, backend stays stateless |
| Very large | Frontend behind CloudFront, backend behind ALB |

The app is *designed* to scale even though the demo runs at small size.

---

## 8. Failure Domains

| Failure | Impact | Mitigation |
|---|---|---|
| Backend pod dies | In-flight requests fail | readiness probe removes pod; ReplicaSet recreates |
| Postgres pod dies | Writes fail | StatefulSet restarts on same PVC → data intact |
| Node dies (EKS) | Pods on node lost | Managed node group replaces node |
| AZ outage | Partially degraded | Multi-AZ subnets + scheduled pods |
| Bad deploy | Broken app | Helm rollback to previous revision |

---

## 9. Security Posture

- **AuthN:** JWT (HS256, 7-day expiry) issued by backend after bcrypt comparison.
- **AuthZ:** role claim in JWT; `roleMiddleware('admin')` gates admin routes.
- **Transport:** TLS terminated at Ingress (ALB + ACM on EKS).
- **Secrets:** Kubernetes Secret for DB + JWT; Jenkins Credentials for pipeline.
- **Container:** non-root UID, read-only root FS where practical.
- **Supply chain:** Trivy scans images in Jenkins before push.

---

## 10. Diagram: Full Stack in EKS

```
                        Internet
                           │
                           ▼
                   ┌────────────────┐
                   │   AWS ALB      │  ← created by ALB Ingress Controller
                   └───────┬────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
         /  → frontend         /api → backend
                │                     │
                ▼                     ▼
      ┌───────────────────┐   ┌───────────────────┐
      │ shopkart-frontend │   │ shopkart-backend  │
      │ (Nginx + React)   │──▶│ (Express + pg)    │
      └───────────────────┘   └─────────┬─────────┘
                                        │
                                        ▼
                             ┌───────────────────┐
                             │ shopkart-postgres │
                             │ StatefulSet + PVC │
                             └───────────────────┘
```

---

## 11. What Each Phase Adds

| Phase | Adds |
|---|---|
| 1 | Architecture, tree, contracts (this doc) |
| 2 | Frontend code |
| 3 | Backend code |
| 4 | DB schema + seed |
| 5 | Dockerfiles + Compose |
| 6 | GitHub config |
| 7 | Jenkins pipeline |
| 8 | Raw K8s manifests |
| 9 | Helm chart |
| 10 | Killercoda deploy guide |
| 11 | Terraform for AWS |
| 12 | EKS deploy guide |
| 13 | Prometheus + Grafana |
| 14 | Tests + security + troubleshooting + interview Qs |
