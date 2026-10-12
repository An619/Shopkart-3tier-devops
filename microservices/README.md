# ShopKart Microservices

This directory contains a Maven multi-module Java 21 / Spring Boot 3 foundation for gradually splitting the existing ShopKart monolith into independently deployable Product, Order, and Inventory services.

## Run tests

From this directory:

```bash
docker compose up -d postgres
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

Product, Order, and Inventory now have separate PostgreSQL databases for their current data models. This is still not a full replacement for the original app: user/auth, category, cart, payment, review, wishlist, admin, frontend gateway integration, checkout consistency, migration of existing production data, and end-to-end parity are not yet complete. Demo credentials are local-only. Do not route production traffic or remove the monolith until tests and parity checks pass.

See [the migration guide](../docs/MICROSERVICES-MIGRATION.md) for Kubernetes, Killercoda, Jenkins, SonarQube, Docker, and Argo CD setup.
