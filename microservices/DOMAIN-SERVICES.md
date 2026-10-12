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
