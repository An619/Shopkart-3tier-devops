# ShopKart Microservices

This directory contains a Maven multi-module Java 21 / Spring Boot 3 foundation for gradually splitting the existing ShopKart monolith into independently deployable Product, Order, and Inventory services.

## Run tests

From this directory:

```bash
mvn -B clean verify
```

## Run locally with Docker Compose

From this directory:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f
curl http://localhost:8081/actuator/health
curl http://localhost:8081/api/products
curl http://localhost:8082/actuator/health
curl http://localhost:8083/api/inventory/1
docker compose down
```

Ports: Product 8081, Order 8082, Inventory 8083.

## Important limitations

These starter services use in-memory demo data, so state is not durable or shared across replicas. They are a migration foundation, not a production-ready replacement for the existing app. Before routing real frontend traffic, implement service-owned persistence and migrations, authentication/authorization, API gateway/routing, and end-to-end/contract tests.

See [the migration guide](../docs/MICROSERVICES-MIGRATION.md) for Kubernetes, Killercoda, Jenkins, SonarQube, Docker, and Argo CD setup.
