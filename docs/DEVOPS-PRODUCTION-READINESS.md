# ShopKart DevOps engineering blueprint

This is a portfolio/lab implementation intended to demonstrate experienced DevOps practices. It is not a claim of five years of employment or a production certification.

## Current service topology

| Component | Port | Data store | State |
|---|---:|---|---|
| Product Service (Spring Boot) | 8081 | shopkart_products | Initial API, tests, actuator |
| Order Service (Spring Boot) | 8082 | shopkart_orders | Inventory checkout + persisted reservation IDs + scheduled confirmation retry |
| Inventory Service (Spring Boot) | 8083 | shopkart_inventory | Atomic reservation/confirm/release API |
| Identity, Catalog, Cart, Wishlist, Orders, Admin (Node domain processes) | 5000 internally | Legacy shared schema | Transitional strangler extraction |
| React frontend + Nginx API gateway | 8080 locally | N/A | Existing frontend and route gateway |

The three Java services use separate logical PostgreSQL databases in the local lab. They share one PostgreSQL server in Compose for cost-effective practice; use independently managed databases/credentials for a production deployment. The six Node domain processes still share the legacy schema and reuse the same Node application image. That is a migration stage, not full data isolation. A Catalog-owned schema and repeatable backfill utility have been added as the first extraction foundation; runtime cutover is deliberately not enabled until reconciliation and API parity are proven.

## Checkout orchestration and recovery

Order Service reserves each distinct product using a unique reservation ID and persists those IDs with a RECONCILIATION_REQUIRED order before attempting remote confirmation. The inventory confirmation endpoint is idempotent, so a scheduled worker retries confirmations after a request failure or Order Service restart and marks the order CONFIRMED when all confirmations succeed. If reservation fails before order creation, already acquired reservations are released in reverse order.

This is a durable recovery foundation, not a complete production saga/outbox: there is no dead-letter queue or operator resolution endpoint yet; retries are bounded per sweep but can repeat indefinitely; a process crash between reserving stock and inserting the order can still leave an orphan reservation. Add a durable reservation-intent/outbox before reservation, alerting, dead-letter/manual repair, and explicit compensation for confirmed inventory before production.

## Local smoke test

```bash
cd microservices
docker compose up --build -d
docker compose ps
curl -fsS http://localhost:8081/actuator/health
curl -fsS http://localhost:8081/api/products
curl -fsS http://localhost:8082/actuator/health
curl -fsS http://localhost:8083/api/inventory/1

# Reserve 2 units, confirm, and inspect stock. Use a fresh reservation ID.
curl -i -X POST http://localhost:8083/api/inventory/reservations \
  -H 'Content-Type: application/json' \
  -d '{"reservationId":"local-demo-001","productId":1,"quantity":2}'
curl -i -X POST http://localhost:8083/api/inventory/reservations/local-demo-001/confirm
curl -fsS http://localhost:8083/api/inventory/1

# Create an order; this calls Inventory Service.
curl -i -X POST http://localhost:8082/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"demo-customer","productIds":[1,2]}'

docker compose down
```

The inventory endpoint only seeds products 1–3 in the local schema. Avoid reusing a reservation ID after releasing it.

## Monitoring

The full-stack Compose file starts Prometheus on port 9090 and Grafana on port 3000. Prometheus scrapes the Java services' Spring Boot Actuator metrics endpoint. Grafana provisions a Prometheus data source and a baseline dashboard automatically. Use a private local password for Grafana and never reuse the documented lab examples for any shared environment.

## Jenkins

Use Jenkinsfile.microservices as a dedicated pipeline while retaining the original monolith Jenkinsfile. Configure Jenkins with:
- Docker-capable agent and Java 21, Maven 3.9+, Node 20, kubectl, Helm and Docker CLI.
- Username/password credential ID dockerhub-creds for a registry account.
- SonarQube server named sonarqube in Jenkins global configuration, plus scanner integration.
- No long-lived secrets in repository files. Use credentials bindings and scoped service accounts.

Stages cover Node lint/tests/build, Maven verify, Compose/Kustomize/Helm validation, SonarQube, five image builds, Trivy scanning and immutable build-number/SHA tags. Registry publishing requires valid credentials. A green build does not itself prove successful cluster deployment.

## Argo CD

Install Argo CD into the target cluster, then apply:

```bash
kubectl apply -f deploy/argocd/shopkart-microservices-application.yaml
```

The application watches the feature branch and synchronizes the Kustomize path. This is intentionally a lab configuration: before production, pin to a reviewed release tag/commit, protect the branch, restrict Argo CD project permissions, and verify image tags and secrets. Do not enable this Application against a cluster until the target namespace, registry image names, secrets, persistent volumes and ingress are configured.

## Next acceptance gates

- [ ] Add service-specific database credentials and least-privilege roles; separate databases physically where required.
- [x] Add CodeQL static security analysis for Java and JavaScript/TypeScript, plus weekly Dependabot updates for npm, Maven, Docker images, and GitHub Actions. Review and remediate findings; workflow files being present does not mean a clean security report.
- [ ] Remove Node cross-domain SQL dependencies before separating Identity, Catalog, Cart, Wishlist, Orders and Admin data.
- [x] Persist order reservation IDs and retry idempotent inventory confirmations after a failure/restart.
- [ ] Add a reservation-intent/outbox before remote reservation, alerting, dead-letter handling, and operator-assisted reconciliation for permanent failures/orphan reservations.
- [ ] Add authn/authz between internal services, rate limits, request IDs and audit logs.
- [ ] Add contract tests and end-to-end tests against the frontend/API gateway, including rollback and concurrent-stock cases.
- [ ] Add schema migration tooling (Flyway/Liquibase) instead of relying on startup schema SQL.
- [ ] Add OpenTelemetry tracing, Prometheus scraping, Grafana dashboards and actionable alerts for stuck reconciliation.
- [ ] Use external secret management, signed/pinned images, SBOM, admission policies and image scanning remediation.
- [ ] Run load, failover, backup/restore and disaster-recovery exercises.
- [ ] Validate manifests and deploy in Killercoda before any paid EKS cluster.

## Incident runbook starter

1. Check kubectl get pods,svc,events -n shopkart-microservices.
2. Inspect kubectl logs deploy/order-service -n shopkart-microservices --since=15m and the Inventory deployment.
3. Inspect orders in RECONCILIATION_REQUIRED; the worker retries confirmations automatically. Investigate repeated warnings and inventory reservation state before manual intervention.
4. Verify database readiness, connection counts, and available stock before replaying a request.
5. Roll back the GitOps commit/image tag through Git, let Argo CD reconcile, and verify readiness plus API smoke tests.
6. Record timeline, impact, root cause, detection gap, and preventive actions in a blameless postmortem.
