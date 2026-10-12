# ShopKart microservices migration status

## Implemented in the feature branch

- Java/Spring Boot Product, Order and Inventory service experiment under `microservices/`.
- PostgreSQL schemas and local Compose for those services.
- A domain-mode switch in the original Node backend: `SERVICE_NAME=identity|catalog|cart|wishlist|orders|admin`.
- `microservices/domain-compose.yml` starts those domain API processes behind an Nginx gateway while retaining the existing route contracts.
- Main branch remains unchanged; review through the draft pull request.

## Not yet safe to call a complete production microservices conversion

The domain-mode services still use the legacy shared PostgreSQL schema and shared Node codebase. The separate Java Product/Order/Inventory implementation is not yet wired as the authoritative backend for the frontend, and the domain Compose stack has not been built or tested in this environment. Independent database ownership, schema/data migration, reliable checkout orchestration (idempotency/outbox/saga or compensation), service authentication, production secret management, Kubernetes deployment for every domain, CI gates, and end-to-end verification remain necessary.

Use the domain Compose stack as an incremental extraction lab only. Do not merge the PR or decommission the monolith until automated checks and user-journey tests pass.
