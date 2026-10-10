# Interview Questions — ShopKart DevOps Project

60 questions tied directly to this project, with answers.

---

## Beginner (20)

### 1. What is a 3-tier application?

A 3-tier app separates concerns into presentation (frontend), application logic (backend API), and data (database). In ShopKart: React SPA, Node/Express API, PostgreSQL.

### 2. Why is ShopKart 3-tier and not 2-tier?

The frontend never talks to Postgres. Every request goes through the backend API. This lets us scale, secure, and replace each tier independently.

### 3. What is Docker?

A tool that packages an application with its dependencies into a portable image. ShopKart uses multi-stage Dockerfiles for both frontend and backend.

### 4. What does docker compose up -d do?

Starts all services defined in docker-compose.yml in the background. ShopKart's compose starts postgres, backend, and frontend.

### 5. What is the difference between an image and a container?

An image is the blueprint (read-only). A container is a running instance of that image.

### 6. What is Kubernetes?

A container orchestrator that manages deployments, scaling, networking, and self-healing for containers. We deploy ShopKart to Kubernetes (Killercoda and EKS).

### 7. What is a Kubernetes Pod?

The smallest deployable unit — one or more containers sharing network and storage. ShopKart's backend pods run one container each.

### 8. What is a Deployment vs a StatefulSet?

Deployments are for stateless workloads (frontend, backend). StatefulSets are for stateful workloads needing stable identity and storage (Postgres).

### 9. Why is Postgres a StatefulSet in ShopKart?

Because it needs stable DNS (shopkart-postgres-0), ordered start/stop, and its own PVC.

### 10. What does a Kubernetes Service do?

Gives pods a stable IP and DNS name. Frontend Service, backend Service, and Postgres Service in ShopKart.

### 11. What is a Kubernetes ConfigMap?

Stores non-secret config as key-value pairs. ShopKart's ConfigMap holds DB_HOST, PORT, etc.

### 12. What is a Kubernetes Secret?

Stores sensitive config (base64-encoded, not encrypted by default). Holds DB password and JWT secret.

### 13. What is an Ingress?

Routes external HTTP(S) traffic to services based on host/path. ShopKart's Ingress routes /api to backend and / to frontend.

### 14. What is a HorizontalPodAutoscaler?

Automatically scales pods based on metrics. ShopKart's HPA scales the backend from 2 to 6 replicas at 70% CPU.

### 15. What is Helm?

A package manager for Kubernetes. Bundles manifests into a chart with values. ShopKart has helm/shopkart/.

### 16. What is Terraform?

An Infrastructure-as-Code tool. Declarative config produces real infrastructure. Used for ShopKart's AWS VPC + EKS.

### 17. What is EKS?

Amazon Elastic Kubernetes Service — a managed Kubernetes control plane. AWS runs it, we manage workers.

### 18. What is Docker Hub?

A public registry for Docker images. ShopKart's images are pushed here by Jenkins.

### 19. What is a Jenkins pipeline?

A series of automated stages defined in a Jenkinsfile. ShopKart runs Checkout, Install, Lint, Test, Build, Scan, Push, Deploy.

### 20. What is Prometheus and Grafana?

Prometheus scrapes metrics. Grafana visualizes them. Together they monitor ShopKart's cluster and app.

---

## Intermediate (20)

### 21. How does the frontend reach the backend inside Kubernetes?

The frontend nginx container proxies /api/* to shopkart-backend:5000 using the backend Service DNS name.

### 22. Why use a ConfigMap for env vars instead of the Deployment spec?

ConfigMaps decouple config from code. Change one ConfigMap, restart pods — no rebuild needed.

### 23. What is the difference between a Secret and a ConfigMap?

Secrets are base64-encoded (not encrypted) and tracked separately. Both are key-value; Secrets are for sensitive values only.

### 24. Why is JWT good for horizontal scaling?

JWTs are stateless. Any backend pod can validate a token without a shared session store.

### 25. Why use bcrypt for passwords?

bcrypt is slow by design (cost factor), making brute force impractical. We use cost 12.

### 26. What does a readiness probe do?

Tells Kubernetes whether the pod is ready to serve traffic. If it fails, the pod is removed from the Service endpoints but not killed.

### 27. What does a liveness probe do?

Tells Kubernetes whether the pod is alive. If it fails repeatedly, the pod is restarted.

### 28. What does a startup probe do?

Gives the app time to boot before readiness/liveness probes kick in. Useful for slow startups.

### 29. Why set resource requests and limits?

Requests guarantee scheduling resources. Limits cap usage to prevent one pod from starving others.

### 30. What is the difference between ClusterIP, NodePort, and LoadBalancer?

ClusterIP: internal only (default). NodePort: exposes on each node's IP. LoadBalancer: cloud provider provisions an external LB. ShopKart uses ClusterIP internally, Ingress + LoadBalancer externally.

### 31. What is a RollingUpdate?

Default Deployment strategy that replaces pods gradually. maxSurge=1, maxUnavailable=0 gives zero downtime.

### 32. Why not use Postgres in the cluster for production?

Stateful databases need backup, replication, failover, and tuning. Managed services (RDS) handle these. In-cluster Postgres is fine for demos.

### 33. What is the difference between EKS and self-managed Kubernetes?

EKS runs the control plane for you. You only manage worker nodes (or use Fargate).

### 34. Why Terraform over CloudFormation?

Terraform is multi-cloud, has a large module ecosystem, and a clearer plan/apply model.

### 35. Why use Helm over raw kubectl apply?

Helm adds templating, values, rollback, release history, and dependencies. One chart, many environments.

### 36. What does helm rollback do?

Reverts a release to a previous revision. ShopKart: helm rollback shopkart 1 restores the first revision.

### 37. How does the Jenkins pipeline get credentials?

Via the Jenkins Credentials plugin. dockerhub-creds, kubeconfig-creds, github-webhook-secret. Never in the Jenkinsfile.

### 38. What does a Trivy scan do?

Scans Docker images for known CVEs. The pipeline can fail on CRITICAL severity.

### 39. How do you achieve zero-downtime deploys in ShopKart?

RollingUpdate strategy plus readiness probes, 2 replicas, and maxUnavailable=0.

### 40. What metrics does ShopKart expose?

prom-client in the backend exposes shopkart_http_requests_total, shopkart_http_request_duration_seconds, shopkart_orders_created_total, and shopkart_cart_adds_total.

---

## Advanced (20)

### 41. How would you migrate ShopKart's Postgres to RDS with minimal downtime?

1. Provision RDS.
2. Set up logical replication from in-cluster Postgres to RDS.
3. Cut over writes during a maintenance window.
4. Update backend ConfigMap DB_HOST to the RDS endpoint.
5. Restart backend pods (rolling).
6. Decommission in-cluster Postgres.

### 42. How would you add TLS to ShopKart's ingress?

Install cert-manager plus a Let's Encrypt ClusterIssuer. Add annotation cert-manager.io/cluster-issuer: letsencrypt-prod and a tls block to the Ingress. Cert-manager auto-provisions and renews certs.

### 43. How would you implement GitOps for ShopKart?

Install Argo CD or Flux. Point it at a repo containing the Helm chart plus values. Git becomes the source of truth; the cluster reconciles to match. Jenkins stops deploying — it only builds and pushes images and commits a new image tag.

### 44. What is the difference between a StatefulSet and an Operator for Postgres?

StatefulSet gives stable identity and storage. Operators add automation: backups, failover, upgrades, tuning. Zalando and CloudNativePG operators make Postgres production-grade.

### 45. How do you handle secrets without committing them?

Options:
1. Sealed Secrets — encrypt with a cluster key, commit the sealed secret.
2. External Secrets Operator — pull from AWS Secrets Manager or Vault.
3. SOPS — encrypt files with KMS.
All avoid plaintext secrets in Git.

### 46. How do you scale Postgres in Kubernetes?

Vertical: bigger PVC and resources. Horizontal: read replicas plus streaming replication and a connection pooler (PgBouncer). Beyond that, move to a managed service.

### 47. How do you debug a pod that crashes at startup?

1. kubectl logs -n shopkart pod --previous
2. kubectl describe pod -n shopkart pod — check Events
3. kubectl exec -it pod -- sh (if it stays up long enough)
4. Check probes, env, volumes, image tag.

### 48. How would you add a canary deployment to ShopKart?

Deploy a second Deployment (backend-canary) with 1 replica. Route a small percentage via Ingress annotations (nginx.ingress.kubernetes.io/canary) or a service mesh (Istio/Linkerd). Monitor metrics; promote or rollback.

### 49. How do you prevent the DB password from appearing in Jenkins logs?

Use withCredentials blocks or the Credentials plugin, which auto-masks values. Never echo secrets. In ShopKart's Jenkinsfile, DOCKERHUB_CREDS_PSW is used only inside sh with --password-stdin.

### 50. What is IRSA and why use it?

IAM Roles for Service Accounts. Associates a K8s ServiceAccount with an IAM role via OIDC, so pods get AWS permissions without node-level IAM. Enables least privilege.

### 51. How do you back up ShopKart's Postgres?

pg_dump to S3 on a schedule. WAL archiving to S3 for point-in-time recovery. Or use a managed service (RDS) with automated backups. Test restores regularly.

### 52. How do you achieve multi-region ShopKart?

Deploy the stack in 2 regions. Route 53 latency-based routing. Replicate the DB cross-region (RDS read replicas plus promotion). S3 with cross-region replication for assets.

### 53. How do you handle database migrations in a CI/CD pipeline?

Options:
1. Run migrations as a Kubernetes Job before the backend Deployment.
2. Use an init container in the backend pod.
3. Gate the backend rollout on successful migration.
ShopKart's migrate.js reads schema.sql and migration files.

### 54. What is a PodDisruptionBudget and why use it?

Limits how many pods can be unavailable during voluntary disruptions (node drains, upgrades). E.g., minAvailable=1 for the backend so a node drain does not kill both replicas.

### 55. How do you monitor a Node.js app?

Expose prom-client metrics. Add event loop lag, GC pauses, heap usage. The default metrics from prom-client cover most of this.

### 56. What is a ServiceMonitor?

A Prometheus Operator CRD. Declares what to scrape. ShopKart applies one for the backend's /metrics endpoint with label release: kube-prom.

### 57. How do you test the Helm chart without installing?

helm template shopkart ./helm/shopkart -n shopkart renders manifests locally. helm lint checks structure. Both run in the pipeline before install.

### 58. How do you handle a failed Helm upgrade?

Helm keeps revision history. If a release is in failed state, run helm rollback shopkart previous-revision. Investigate logs, fix values, re-upgrade.

### 59. What does kubectl apply -k k8s/ do?

Applies all resources listed in kustomization.yaml. It uses Kustomize to layer and manage manifests without Helm.

### 60. How would you reduce ShopKart's AWS bill by 50%?

1. Use Spot instances for worker nodes (savings around 70%).
2. Schedule clusters to shut down outside business hours.
3. Use a single NAT Gateway, or none with VPC endpoints.
4. Right-size nodes (fewer, smaller).
5. Use Fargate for burst workloads.
6. Consider EKS on Graviton (ARM) for cost and performance.
