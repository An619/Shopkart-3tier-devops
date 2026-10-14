# Catalog shadow runtime

The feature branch includes an opt-in Catalog runtime that connects to the dedicated
`shopkart_catalog` database. It is deliberately not connected to the Nginx gateway:
the storefront and checkout continue to use the legacy Catalog path until parity and
Inventory ownership gates are met.

## Local verification

From the repository root, set local development secrets and run:

```bash
export POSTGRES_PASSWORD='replace-with-a-local-password'
export JWT_SECRET='replace-with-a-long-local-development-secret'
export GRAFANA_ADMIN_PASSWORD='replace-with-a-local-password'
docker compose -f microservices/domain-compose.yml --profile catalog-extraction up --build -d postgres catalog-service catalog-extracted-service
docker compose -f microservices/domain-compose.yml exec -T catalog-extracted-service npm run migrate:catalog
```

The backfill copies categories, products and reviews to `shopkart_catalog` and checks
row counts. The dedicated GitHub Actions workflow then compares the legacy and extracted
Catalog API product IDs/names and category IDs/names after backfill. It uses a disposable
database and destroys the Compose volumes at the end.

To stop the local test stack:

```bash
docker compose -f microservices/domain-compose.yml down
```

For a fully disposable local test, use `down -v` only if you are certain the named
volumes do not contain data you need.

## What this does not mean

- The gateway is not switched to the extracted runtime.
- Product stock is still present in the legacy Catalog model and is not yet authoritative
  in the dedicated database; checkout/Inventory ownership must be completed before cutover.
- The extracted process uses the author-name snapshot in Catalog reviews instead of joining
  the Identity `users` table. New review writes use a generic display-name fallback until
  a safe Identity API or trusted identity claim supplies a display-name snapshot.
- The local Compose database user is shared for convenience; production must use separate
  least-privilege database roles and credentials.

The workflow is a shadow-runtime parity gate, not proof of production readiness. Expand
parity to review contents, filtering/sorting/pagination, admin writes, error contracts,
timeouts, and Inventory/checkout integration before routing user traffic to this runtime.
