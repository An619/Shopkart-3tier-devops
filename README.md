# ShopKart — 3-Tier E-Commerce DevOps Project

> A Flipkart-inspired learning project using an original brand. This repository's default branch preserves the original 3-tier application. The microservices migration is developed separately so the original app remains available.

## Branches

- **main** — original ShopKart 3-tier application.
- **feature/microservices-devops** — incremental microservices migration foundation with Java 21, Spring Boot, Maven, Docker, Jenkins, SonarQube, Kubernetes, and Argo CD configuration.

[Open the microservices branch](https://github.com/An619/Shopkart-3tier-devops/tree/feature/microservices-devops)

## Microservices branch

Initial services:
- Product Service — HTTP port 8081
- Order Service — HTTP port 8082
- Inventory Service — HTTP port 8083

Read the [migration guide](docs/MICROSERVICES-MIGRATION.md) and [microservices README](microservices/README.md) for setup and pipeline instructions.

### Local verification

Requirements: Java 21, Maven 3.9+, Docker Engine and Docker Compose.

```bash
git checkout feature/microservices-devops
cd microservices
mvn -B clean verify
docker compose up --build -d
docker compose ps
curl http://localhost:8081/actuator/health
curl http://localhost:8081/api/products
curl http://localhost:8082/actuator/health
curl http://localhost:8083/api/inventory/1
docker compose down
```

### Learning and deployment order

1. Run Maven tests and Docker Compose locally.
2. Build/publish the three images to a registry you control.
3. Deploy the Kubernetes manifests on Killercoda first; AWS is not required for this learning stage.
4. Configure Jenkins agents, credentials, Maven, SonarQube and Docker image scanning.
5. Configure Argo CD to sync the reviewed Kubernetes manifests from Git.
6. Only after the same manifests work on Killercoda, adapt and deploy to a real Kubernetes cluster or AWS EKS.

## Scope and maturity notice

The microservices branch is an educational migration foundation, **not yet a production-ready replacement** for the monolith. Product, Order and Inventory now use separate PostgreSQL databases in the learning setup, and an API gateway routes those path families while forwarding unmigrated routes to the legacy backend. The frontend API contract is not yet verified; Identity/User, Category, Cart, Payment, Review, Wishlist and Admin domains, secure production secrets/database roles, data migration, checkout consistency, and end-to-end parity tests remain required before the monolith can be retired.

Never commit real credentials, access tokens, passwords, or production secrets. Use Jenkins credentials and your cluster's secret-management approach.

## Full conversion acceptance contract

The complete domain map and required acceptance checklist are documented in [docs/MICROSERVICES-COMPLETE-MIGRATION.md](docs/MICROSERVICES-COMPLETE-MIGRATION.md). The current branch is still an in-progress migration: Product, Order and Inventory have initial persistent APIs, but the full monolith feature set is not yet replaced. Do not treat it as a completed or production-ready conversion until that checklist is implemented and verified.
