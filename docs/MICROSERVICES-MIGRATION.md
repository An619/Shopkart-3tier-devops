# ShopKart: Monolith-to-Microservices Migration

## What this branch changes

This branch introduces a Java 21 / Spring Boot 3 / Maven multi-module foundation alongside the existing Node.js monolith. The existing `main` branch and its Killercoda path are left unchanged.

Initial bounded contexts:
- **Product service** — product catalogue read/create API, port 8081.
- **Order service** — order creation/list/status API, port 8082.
- **Inventory service** — stock lookup/update API, port 8083.

Each service has its own Spring Boot entry point, Actuator health endpoints, Dockerfile, Kubernetes Deployment and ClusterIP Service. The Maven parent centralizes dependency versions. Argo CD watches the Kubernetes Kustomize path on this branch.

## Important migration status

This remains an **in-progress incremental migration**, not a complete replacement of the monolith. Product, Order and Inventory now use JDBC with separate PostgreSQL databases and schema initialization. Docker Compose and Kubernetes include a PostgreSQL instance for learning. The gateway routes these three API path families to the new services and sends other `/api/` routes to the legacy `backend` service. The current Java APIs are not yet proven response-compatible with the React frontend, and authentication, Category, Cart, Payment, Review, Wishlist, User and Admin services are not migrated. Do not remove the monolith or route real user traffic until API contract, authorization, data migration and end-to-end parity tests pass.

## Local / Killercoda build

Prerequisites: Java 21, Maven 3.9+, a Docker-compatible builder, and kubectl. No AWS is required.

```bash
cd microservices
docker compose up -d postgres
mvn -B clean verify
```

Build individual images from the repository root:

```bash
docker build -f microservices/product-service/Dockerfile -t shopkart-product-service:dev microservices
docker build -f microservices/order-service/Dockerfile -t shopkart-order-service:dev microservices
docker build -f microservices/inventory-service/Dockerfile -t shopkart-inventory-service:dev microservices
```

For a Kubernetes playground where images cannot be imported into the node runtime, push images to a registry you control and replace `YOUR_DOCKERHUB_USERNAME` in the manifests. Then:

```bash
kubectl apply -k deploy/kubernetes/microservices
kubectl rollout status deployment/shopkart-gateway -n shopkart-microservices
kubectl rollout status statefulset/postgres -n shopkart-microservices
kubectl rollout status deployment/product-service -n shopkart-microservices
kubectl rollout status deployment/order-service -n shopkart-microservices
kubectl rollout status deployment/inventory-service -n shopkart-microservices
kubectl get pods,svc -n shopkart-microservices
```

Test a service through port-forward:

```bash
kubectl port-forward -n shopkart-microservices svc/product-service 8081:8081
# In another terminal:
curl http://127.0.0.1:8081/actuator/health
curl http://127.0.0.1:8081/api/products
```

## Jenkins + Maven + SonarQube + Docker

Use `microservices/Jenkinsfile` as the Jenkinsfile path for a Multibranch Pipeline job. Configure:
- Jenkins agent label `maven-docker` with Java 21, Maven 3.9+, Docker CLI/daemon, Trivy, and workspace cleanup support.
- SonarQube server name `SonarQube` in Jenkins global configuration.
- Jenkins Secret Text credential `sonarqube-token`.
- Jenkins Username/Password credential `dockerhub-creds`.
- Replace `YOUR_DOCKERHUB_USERNAME` in the Jenkinsfile and Kubernetes manifests with your Docker Hub namespace.
- Configure the SonarQube webhook to Jenkins `/sonarqube-webhook/` so the quality-gate stage can return a result.

The pipeline verifies Maven modules, performs SonarQube analysis and a quality gate, builds three images, scans them with Trivy, and publishes images only when the job is running on `main`. For this migration branch, first validate build/test/analysis stages and configure publishing when promoting the implementation.

## Argo CD

Install Argo CD in the Killercoda cluster if the scenario supports it and ensure it can reach GitHub. Review the repo URL and branch in `deploy/argocd/shopkart-microservices.yaml`, then:

```bash
kubectl apply -f deploy/argocd/shopkart-microservices.yaml
kubectl -n argocd get applications
kubectl -n shopkart-microservices get pods,svc
```

Argo CD is the deployment controller; Jenkins builds, tests, scans and publishes immutable images. In a mature GitOps flow, CI updates the image tag in a dedicated environment/config repository (or opens a PR), and Argo CD syncs that reviewed change. Avoid giving Jenkins unrestricted cluster-admin credentials.

## Production-hardening milestones

1. Finish service-owned persistence, versioned migrations and least-privilege database roles; current learning setup uses separate databases on one PostgreSQL instance.
2. Implement Identity/User, Category, Cart, Payment, Review, Wishlist and Admin services with the original domain rules.
3. Verify gateway routes and preserve the frontend API response contract before switching frontend traffic.
4. Add unit, integration and contract tests; coverage and enforced Sonar quality gates.
5. Publish immutable image tags and an SBOM; enforce Trivy HIGH/CRITICAL policy after resolving baseline findings.
6. Add NetworkPolicies, service accounts/RBAC, PodDisruptionBudgets, autoscaling and external secret management.
7. Add OpenTelemetry traces, structured logs, and Prometheus/Grafana dashboards.
8. Move to EKS only after the same manifests work in Killercoda; EKS is not required for the first stages.
