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

## Full-stack domain stack

From the repository root, the full stack includes the existing React app, Nginx gateway, six Node domain processes and the Java Product/Order/Inventory APIs:

```bash
export POSTGRES_PASSWORD='local-only-change-this'
export JWT_SECRET='local-only-secret-at-least-32-characters'
export GRAFANA_ADMIN_PASSWORD='local-only-grafana-password'
docker compose -f microservices/domain-compose.yml up --build -d
docker compose -f microservices/domain-compose.yml ps
curl -fsS http://localhost:8080/api/health
curl -fsS http://localhost:8080/api/v2/products
curl -fsS http://localhost:8080/api/v2/inventory/1
# Prometheus UI: http://localhost:9090 ; Grafana UI: http://localhost:3000
curl -i -X POST http://localhost:8080/api/v2/orders \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"demo-customer","productIds":[1,2]}'
docker compose -f microservices/domain-compose.yml down
```

Legacy frontend paths such as /api/products continue to route to the Node Catalog domain so the UI contract is not silently broken. The new Java APIs are exposed under /api/v2/products, /api/v2/orders and /api/v2/inventory while parity testing continues.

## Important limitations

Product, Order, and Inventory now have separate PostgreSQL databases for their current data models. This is still not a full replacement for the original app: user/auth, category, cart, payment, review, wishlist, admin, frontend gateway integration, checkout consistency, migration of existing production data, and end-to-end parity are not yet complete. Demo credentials are local-only. Do not route production traffic or remove the monolith until tests and parity checks pass.

See [the migration guide](../docs/MICROSERVICES-MIGRATION.md) for Kubernetes, Killercoda, Jenkins, SonarQube, Docker, and Argo CD setup.
