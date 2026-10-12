# ShopKart Microservices

This directory contains a Maven multi-module Java 21 / Spring Boot 3 foundation for gradually splitting the existing ShopKart monolith into separately deployable Product, Order, and Inventory services.

See [the migration guide](../docs/MICROSERVICES-MIGRATION.md) for scope, limitations, local/Killercoda commands, Jenkins/SonarQube configuration, and Argo CD instructions.

Run checks from this directory:

```bash
mvn -B clean verify
```

These starter services currently use in-memory demo data. State is not durable or shared between replicas; replace it with service-owned persistence before production use. Keep the original Node.js application and deployment path intact until API compatibility and data migration are tested.
