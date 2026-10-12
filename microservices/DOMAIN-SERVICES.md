# ShopKart domain-service Compose stack

This stack runs the existing ShopKart Node/Express domain routes as independently
deployable API processes behind an Nginx gateway while preserving the current
HTTP route contracts.

## Services and routes

| Service | Routes |
| --- | --- |
| identity-service | `/api/auth/**`, `/api/users/**` |
| catalog-service | `/api/products/**`, `/api/categories/**`, `/api/reviews/**` |
| cart-service | `/api/cart/**` |
| wishlist-service | `/api/wishlist/**` |
| orders-service | `/api/orders/**` |
| admin-service | `/api/admin/**` |
| gateway | external API entrypoint on port 8080 |

The app selects a domain with `SERVICE_NAME`; the default `all` mode remains
available for local development and rollback.

## Run on a Linux shell / Killercoda

From the repository root, set non-demo secrets first:

```bash
export POSTGRES_PASSWORD='replace-with-a-long-unique-password'
export JWT_SECRET='replace-with-a-long-random-secret-at-least-32-characters'
docker compose -f microservices/domain-compose.yml config
docker compose -f microservices/domain-compose.yml up --build -d
docker compose -f microservices/domain-compose.yml ps
curl -fsS http://localhost:8080/api/health
curl -fsS http://localhost:8080/api/products
docker compose -f microservices/domain-compose.yml logs --tail=100
docker compose -f microservices/domain-compose.yml down
```

The first boot initializes the database only when the named volume is empty.
Do not run `down -v` unless you intentionally want to delete local data.

## Kubernetes / Argo CD domain stack

The Kustomize bundle now includes six Node domain Deployments, the Nginx gateway,
and a **separate legacy PostgreSQL StatefulSet** initialized from the SQL files in
`deploy/kubernetes/microservices/sql/`. This database is intentionally isolated
from the Java experiment's PostgreSQL instance, but all six Node domain APIs still
share this one legacy database.

Before deploying, build and push the backend image from the repository root:

```bash
docker build -t YOUR_DOCKERHUB_USERNAME/shopkart-backend:latest backend
docker push YOUR_DOCKERHUB_USERNAME/shopkart-backend:latest
docker build -t YOUR_DOCKERHUB_USERNAME/shopkart-frontend:latest frontend
docker push YOUR_DOCKERHUB_USERNAME/shopkart-frontend:latest
```

Replace the image placeholders in `deploy/kubernetes/microservices/domain-services.yaml` and
`deploy/kubernetes/microservices/frontend.yaml` with the pushed images. Create secrets outside Git (do not commit real secrets):

```bash
kubectl create namespace shopkart-microservices --dry-run=client -o yaml | kubectl apply -f -
kubectl -n shopkart-microservices create secret generic shopkart-database \
  --from-literal=POSTGRES_USER=shopkart \
  --from-literal=POSTGRES_PASSWORD='use-a-unique-strong-password' \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n shopkart-microservices create secret generic shopkart-legacy-database \
  --from-literal=POSTGRES_USER=shopkart_user \
  --from-literal=POSTGRES_PASSWORD='use-a-different-unique-password' \
  --from-literal=JWT_SECRET='use-a-long-random-secret-at-least-32-characters' \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -k deploy/kubernetes/microservices
kubectl -n shopkart-microservices get pods,svc
kubectl -n shopkart-microservices rollout status statefulset/shopkart-legacy-postgres
kubectl -n shopkart-microservices rollout status deployment/identity-service
kubectl -n shopkart-microservices port-forward svc/shopkart-frontend 8080:80
```

In another terminal, open `http://localhost:8080` in a browser and verify
`curl -i http://localhost:8080/api/health` and `curl -i http://localhost:8080/api/products`. Argo CD's Application points at
the same Kustomize path; ensure the image and external Secret are ready before
syncing. The SQL bootstrap runs only when the PostgreSQL data volume is first
initialized; changing the SQL files does not automatically migrate an existing
volume.

## Important architecture boundary

This is a **domain-service extraction / strangler step**, not yet a production-grade
fully data-decoupled microservices system. The domain API processes still share the
legacy PostgreSQL schema and the existing model/service code. That preserves API
behavior while allowing route-level deployment and CI practice, but it creates
database coupling and does not yet provide independent data ownership. Before
calling the migration complete, each domain needs owned tables/database and
versioned migrations, cross-domain access through APIs/events, plus contract,
integration, security, checkout-saga and failure-recovery tests. Validate all
images and routes before using this stack for a real deployment.
