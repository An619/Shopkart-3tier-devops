# Complete ShopKart Microservices Migration Map

This document maps the existing ShopKart application domains to independently deployable services. It is the acceptance contract for the migration; the migration is not complete until every row is implemented, integrated with the frontend, and verified by tests.

## Target service boundaries

| Service | Owns | Frontend-compatible routes to preserve |
|---|---|---|
| API Gateway / BFF | External routing, CORS, request IDs, rate limits; no business data | Single browser origin at `/api` |
| Identity Service | Registration, login, password hashing, JWT issuance/validation, user roles | `/api/auth/**` |
| User Service | Profile and account settings | `/api/users/**` |
| Product Service | Product catalogue, search, product details, admin product CRUD | `/api/products/**` |
| Category Service | Category listing and admin category CRUD | `/api/categories/**` |
| Cart Service | User cart and cart item operations | `/api/cart/**` |
| Order Service | Order history, details, cancellation, admin status changes | `/api/orders/**`, `/api/admin/orders/**` |
| Payment Service | Payment intents/status; mock provider for learning only | Checkout payment integration |
| Inventory Service | Stock levels and reservation/release | Internal API used during checkout |
| Review Service | Product reviews, ratings, review moderation | `/api/products/:id/reviews`, `/api/reviews/**` |
| Wishlist Service | User wishlist and item operations | `/api/wishlist/**` |
| Admin / Reporting Service | Dashboard aggregates and admin user listing | `/api/admin/**` not owned by other services |

## Non-negotiable design rules

1. **Database ownership:** each service owns its tables/database and migrations. Other services must not query another service's tables directly.
2. **No in-memory business state:** carts, orders, users, products, stock, reviews and wishlists must survive restarts and work across replicas.
3. **Identity:** passwords use a vetted password-hashing algorithm; access tokens are validated at the gateway and by protected services. Admin authorization is enforced server-side.
4. **Checkout consistency:** order creation, inventory reservation and payment must use an explicit state machine and idempotency keys. Do not claim distributed ACID transactions; use a saga/outbox pattern for reliable cross-service workflows.
5. **API compatibility:** keep the existing React frontend's request paths and response shapes or update its service adapters and tests in the same change.
6. **Reliability:** set connection/read timeouts, bounded retries only for safe operations, health/readiness probes, resource limits, graceful shutdown and structured logs with correlation IDs.
7. **Delivery:** Jenkins runs tests, coverage, SonarQube quality gate, dependency/image scans and builds immutable image tags. Argo CD deploys only reviewed manifest changes; CI must not have cluster-admin.
8. **Secrets:** use environment/secret-manager injection. Never commit real credentials or default production passwords.
9. **Data migration:** migrate existing monolith data with repeatable scripts and reconciliation counts; keep a documented rollback path.
10. **Verification:** run unit, integration, contract, end-to-end, migration, failure/recovery and security tests before removing the monolith from the deployment path.

## Migration completion checklist

- [ ] Inventory every existing backend route, model, validation rule and authorization rule.
- [ ] Implement and test the Identity, User, Product, Category, Cart, Order, Payment, Inventory, Review, Wishlist and Admin domains.
- [ ] Add one owned persistent store and versioned migrations per state-owning service.
- [ ] Implement gateway routing and retain the existing frontend contract.
- [ ] Implement checkout orchestration, inventory reservation/release, payment status handling, idempotency and compensating actions.
- [ ] Add local Docker Compose with health-based dependencies and safe demo-only credentials.
- [ ] Add Kubernetes manifests/Helm, NetworkPolicies, RBAC, secrets integration, probes, PDBs and autoscaling where appropriate.
- [ ] Configure Jenkins + Maven + SonarQube + image/dependency scanning + registry publishing.
- [ ] Configure Argo CD GitOps with immutable image promotion.
- [ ] Pass CI, contract and end-to-end tests; test rolling deployment and rollback.
- [ ] Demonstrate Killercoda deployment before any AWS/EKS deployment.
- [ ] Migrate data, verify counts, document cutover/rollback, and only then decommission the monolith.

## Current status

The existing `feature/microservices-devops` branch currently contains the initial Product, Order and Inventory Spring Boot service prototypes plus CI/CD and Kubernetes foundations. Those prototypes still use in-memory data and do not yet cover the complete domain map above. This document deliberately does not label the application fully converted until the checklist is verified.
