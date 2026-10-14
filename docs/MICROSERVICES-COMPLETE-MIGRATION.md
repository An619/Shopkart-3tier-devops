# ShopKart microservices migration status

## Implemented on `feature/microservices-devops`

- Java/Spring Boot Product, Order and Inventory service experiment with their own database names, Compose, Kubernetes resources and Argo CD application.
- The existing Node/Express API can run bounded domain modes using `SERVICE_NAME`: identity, catalog, cart, wishlist, orders and admin.
- Local `microservices/domain-compose.yml` runs the React frontend, gateway, PostgreSQL and six domain API processes.
- Kubernetes Kustomize resources now include the React frontend Deployment/Service, six Node domain Deployments/Services, Nginx gateway, and a separate PostgreSQL StatefulSet initialized from the bundled legacy schema and seed files.
- NetworkPolicy permits internal traffic to the gateway and Node API ports; the Argo CD Application tracks this feature branch.
- `main` has not been changed. Review via the draft pull request.

## Catalog database extraction foundation

The feature branch now includes `database/catalog/schema.sql` and `backend/src/database/catalog-backfill.js`. The backfill copies category/product/review records with stable IDs, snapshots review-author names, runs target writes in a transaction, and compares source/target row counts. A `migrate:catalog` npm script and CI JavaScript syntax check are wired in, and fresh local PostgreSQL initialization creates `shopkart_catalog`.

This does not switch the Catalog API to the new database and does not prove a live backfill has passed. Before any cutover, run the script against a disposable source/target pair, add field-level reconciliation and API contract tests, move product stock behind Inventory, then remove catalog table joins from Cart/Orders/Admin. Runtime still intentionally uses the shared legacy database.

## Data ownership extraction plan

See [DATA-OWNERSHIP-EXTRACTION.md](DATA-OWNERSHIP-EXTRACTION.md) for the source-verified cross-domain database dependencies, safe extraction sequence, cutover gates, and rollback constraints. This is intentionally not a fake database-per-service change: current cart and order code reads or writes catalog tables directly, so changing database names without first removing those dependencies would break user journeys.

## Additional order/inventory safety hardening

The legacy Node order model now performs an atomic conditional stock decrement inside the order transaction. If another checkout consumes the remaining stock after the initial availability check, the order transaction rolls back with a conflict instead of silently clamping stock to zero and overselling. Order cancellation now locks the user's order row, skips terminal/already-cancelled orders, and restores aggregated item quantities in the same transaction, preventing repeated cancellation from restocking the same order twice. These protections improve the current shared-database phase; they do **not** replace the planned Inventory API reservation/saga needed for independently owned databases.

## Inventory reservation API added

The Java Inventory service now has a transactional reservation lifecycle:

- `POST /api/inventory/reservations` reserves quantity using an atomic conditional stock update and a caller-supplied reservation ID.
- Repeating the same reservation ID and payload is idempotent; reusing the ID with a different payload or insufficient stock returns a conflict.
- `POST /api/inventory/reservations/{reservationId}/confirm` confirms a reservation.
- `POST /api/inventory/reservations/{reservationId}/release` releases an unconfirmed reservation once and restores its quantity once. A confirmed reservation cannot be released by this endpoint; a real checkout saga needs a separately designed compensating operation.
- Added integration tests for idempotency, insufficient stock, one-time release and confirmed reservation behavior.
- CI now includes a Java 21/Maven job that starts the isolated PostgreSQL databases and runs `mvn verify`.

The Java Order service now calls the Inventory reservation API during checkout. It reserves each distinct product, persists the order, and confirms reservations. A reservation failure before order creation triggers best-effort release of earlier reservations. If confirmation fails after the order exists, the order is marked `RECONCILIATION_REQUIRED`; this avoids falsely reporting success, but does not provide durable saga recovery. The existing Node checkout remains on its separate legacy shared-database path.

## Still required before calling this a complete production conversion

This is an incremental strangler migration, **not yet a production-ready fully data-decoupled microservices architecture**. The six Node domains still share the legacy schema and reuse the monolith's Node codebase. The separate Java Product/Order/Inventory implementation is not yet the authoritative backend behind the frontend. Independent database ownership and versioned migrations per domain, cross-domain API/event contracts, service-to-service authorization, durable payment/checkout saga state with idempotency and compensation, production secret management, image pinning, observability, and full end-to-end parity remain. `Jenkinsfile.microservices`, `deploy/argocd/shopkart-microservices-application.yaml`, and `docs/DEVOPS-PRODUCTION-READINESS.md` provide the dedicated CI/CD, GitOps, and operations starting points.

## Validation status

GitHub Actions runs [#11](https://github.com/An619/Shopkart-3tier-devops/actions/runs/38295913272) and [#13](https://github.com/An619/Shopkart-3tier-devops/actions/runs/38296070452) passed on the feature branch. It verified backend lint/tests, frontend lint/tests/build, Compose configuration, Kustomize rendering, built and started the domain Compose stack, smoke-tested health/catalog/categories, verified unauthenticated cart access is rejected, completed registration and login, checked authenticated cart access, and confirmed the identity service returns 404 for the catalog route. This is CI/integration-smoke evidence only; it is not a Kubernetes or Argo CD deployment and does not prove full user-journey parity.

Before merging, deploy to a disposable cluster and test register/login/profile/catalog/cart/wishlist/checkout/order/admin flows. Then complete independent database ownership and migrations, cross-service contracts, and reliable checkout orchestration. Do not merge the draft PR or remove the monolith until failures are fixed and data parity is verified.
