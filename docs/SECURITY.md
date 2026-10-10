# Security — ShopKart DevSecOps

Security measures implemented across the project.

## Application

- JWT authentication (HS256, 7-day expiry)
- bcrypt password hashing (cost 12)
- Input validation on every write endpoint (express-validator)
- Centralized error handling (no stack traces to clients in production)
- Helmet security headers
- CORS restricted to configured origins
- No hard-coded secrets (env vars only)
- Graceful shutdown to avoid dropped connections

## Containers

- Multi-stage Docker builds (dev deps not shipped)
- Alpine base images (small attack surface)
- Non-root user in backend image (`app` user)
- Nginx running as default non-root in frontend image
- `readOnlyRootFilesystem` where practical
- `allowPrivilegeEscalation: false`
- Capabilities dropped to minimum
- HEALTHCHECK in every image

## Kubernetes

- Namespace isolation (`shopkart`)
- Secrets for passwords (never ConfigMaps)
- `runAsNonRoot: true`
- `runAsUser` set explicitly
- Resource requests and limits on every container
- Readiness / liveness / startup probes
- NetworkPolicies (optional, see below)
- Pod Security Standards: restricted baseline

## Secrets Management

Local dev: `.env` files (never committed).

Kubernetes: `kubectl create secret` or Sealed Secrets / External Secrets Operator for GitOps.

Jenkins: Jenkins Credentials plugin. Never in `Jenkinsfile`.

AWS: IAM roles for service accounts (IRSA), no long-lived keys on nodes.

## Supply Chain

- Trivy scans images in the Jenkins pipeline (fails on CRITICAL)
- `npm ci` uses the lockfile (reproducible installs)
- Base images pinned to specific tags, not `latest`
- Dependencies reviewed periodically (`npm audit`)

## RBAC

- EKS cluster role: `AmazonEKSClusterPolicy`
- Node role: `AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`, `AmazonEC2ContainerRegistryReadOnly`
- Application ServiceAccount has no API permissions by default
- Optional: create a role for Prometheus to scrape cluster metrics

## Network

- Nodes in private subnets
- Outbound via NAT Gateway
- EKS control plane endpoint: private + public (can be locked to private only)
- Ingress handles all external traffic

## Recommended Additions

- cert-manager + Let's Encrypt for automatic TLS
- External Secrets Operator + AWS Secrets Manager
- Falco for runtime threat detection
- OPA Gatekeeper for policy enforcement
- NetworkPolicies to restrict DB access to backend only

## Audit Checklist

| Item | Status |
|---|---|
| Non-root containers | ✅ |
| Image scan in CI | ✅ |
| Secrets not in Git | ✅ |
| JWT + bcrypt | ✅ |
| Input validation | ✅ |
| Resource limits | ✅ |
| Health probes | ✅ |
| RBAC least privilege | ✅ |
| TLS in production | ⏳ (enable via ingress + cert-manager) |
