# ShopKart microservices migration status

## Implemented on `feature/microservices-devops`

- Java/Spring Boot Product, Order and Inventory service experiment with their own database names, Compose, Kubernetes resources and Argo CD application.
- The existing Node/Express API can run bounded domain modes using `SERVICE_NAME`: identity, catalog, cart, wishlist, orders and admin.
- Local `microservices/domain-compose.yml` runs the React frontend, gateway, PostgreSQL and six domain API processes.
- Kubernetes Kustomize resources now include the six Node domain Deployments/Services, Nginx gateway, and a separate PostgreSQL StatefulSet initialized from the bundled legacy schema and seed files.
- NetworkPolicy permits internal traffic to the gateway and Node API ports; the Argo CD Application tracks this feature branch.
- `main` has not been changed. Review via the draft pull request.

## Still required before calling this a complete production conversion

This is an incremental strangler migration, **not yet a production-ready fully data-decoupled microservices architecture**. The six Node domains still share the legacy schema and reuse the monolith's Node codebase. The separate Java Product/Order/Inventory implementation is not yet the authoritative backend behind the frontend. Independent database ownership and versioned migrations per domain, cross-domain API/event contracts, service-to-service authorization, payment/checkout saga with idempotency and compensation, production secret management, image pinning, observability, and full end-to-end parity remain.

## Validation status

The GitHub files have been updated, but a successful build, test run, Kustomize render, Compose startup, or Kubernetes/Argo CD deployment has **not** been verified from this environment. Before merging, run backend/frontend lint and tests, validate Compose and Kustomize, build/push the image, deploy to a disposable cluster, and test register/login/catalog/cart/checkout/order/admin flows. Do not merge the draft PR or remove the monolith until failures are fixed and data parity is verified.
