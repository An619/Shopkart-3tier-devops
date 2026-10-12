# ShopKart on Killercoda — Deployment Guide

Real-world deployment notes for running ShopKart on Killercoda's free Kubernetes playground.

This guide captures the **exact working steps** from a successful deployment session, including the workarounds needed because Killercoda runs inside a sandboxed container with no Docker daemon and no Docker Hub credentials.

**Session duration:** ~40 minutes (Killercoda limit: 60 minutes)

---

## Overview

| Item | Value |
|---|---|
| Target environment | Killercoda Kubernetes Playground |
| Container runtime | containerd (`/run/containerd/containerd.sock`) |
| Image builder | nerdctl + BuildKit (rootless mode) |
| Deployment method | Helm (`helm/shopkart` chart) |
| Images | Built locally, loaded into containerd, `imagePullPolicy: Never` |
| Storage class | `local-path` (built into Killercoda) |
| Ingress | NGINX Ingress Controller |

---

## Prerequisites

Before starting:

1. A GitHub account with the ShopKart repo pushed (or use the public repo: `https://github.com/An619/Shopkart-3tier-devops`)
2. Killercoda account (sign in with GitHub)
3. A PAT if your repo is private

**Nothing else.** No Docker Hub, no AWS account, no local Docker.

---

## Stage 1 — Open Killercoda

1. Go to https://killercoda.com/playgrounds/scenario/kubernetes
2. Click **Start**
3. Click **Sign in with GitHub**
4. Click **Authorize**
5. Wait for the `~$` prompt

Verify the cluster is ready:

```bash
kubectl get nodes
kubectl get storageclass
```

**Expected:**
- 1 node in `Ready` state
- `local-path` storage class marked `(default)`

---

## Stage 2 — Install nerdctl + BuildKit

Killercoda doesn't have Docker. It uses containerd. We use `nerdctl` (containerd's Docker-compatible CLI) plus BuildKit for building images.

**Copy-paste this block:**

```bash
# Set containerd socket
export CONTAINERD_ADDRESS=/run/containerd/containerd.sock
echo 'export CONTAINERD_ADDRESS=/run/containerd/containerd.sock' >> ~/.bashrc

# Install nerdctl
cd /tmp
curl -fsSL "https://github.com/containerd/nerdctl/releases/download/v1.7.6/nerdctl-1.7.6-linux-amd64.tar.gz" \
  | tar -xz nerdctl
mv nerdctl /usr/local/bin/nerdctl
chmod +x /usr/local/bin/nerdctl

# Install BuildKit
BUILDKIT_VERSION="v0.16.0"
curl -fsSL "https://github.com/moby/buildkit/releases/download/${BUILDKIT_VERSION}/buildkit-${BUILDKIT_VERSION}.linux-amd64.tar.gz" \
  -o buildkit.tar.gz
tar -xzf buildkit.tar.gz
mv bin/buildctl /usr/local/bin/
mv bin/buildkitd /usr/local/bin/
chmod +x /usr/local/bin/buildctl /usr/local/bin/buildkitd

# Start BuildKit in rootless mode
pkill buildkitd 2>/dev/null
mkdir -p /run/buildkit /tmp/buildkit-root

nohup buildkitd \
  --addr unix:///run/buildkit/buildkitd.sock \
  --root /tmp/buildkit-root \
  --rootless \
  --oci-worker-no-process-sandbox \
  --oci-worker-snapshotter=native \
  > /tmp/buildkitd.log 2>&1 &

sleep 5

# Configure
export BUILDKIT_HOST=unix:///run/buildkit/buildkitd.sock
echo 'export BUILDKIT_HOST=unix:///run/buildkit/buildkitd.sock' >> ~/.bashrc

# Verify
nerdctl --version
buildctl --addr unix:///run/buildkit/buildkitd.sock debug workers
```

**Expected:**
```
nerdctl version 1.7.6
ID                              PLATFORMS
xxxx                            linux/amd64,...
```

### Why rootless?

Killercoda runs inside a container. BuildKit's default process sandbox requires kernel features blocked by the outer container. `--rootless` + `--oci-worker-no-process-sandbox` is the only working combination.

---

## Stage 3 — Clone the Repo

```bash
cd ~
git clone https://github.com/An619/Shopkart-3tier-devops.git
cd Shopkart-3tier-devops
ls
```

If private repo prompts for credentials:
- Username: your GitHub username
- Password: your Personal Access Token

---

## Stage 4 — Build Images

```bash
cd ~/Shopkart-3tier-devops

# Build backend (~3 min)
nerdctl --namespace k8s.io build -t shopkart-backend:latest ./backend

# Build frontend (~4 min)
nerdctl --namespace k8s.io build -t shopkart-frontend:latest ./frontend

# Verify
nerdctl --namespace k8s.io images | grep shopkart
```

**Expected:**
```
shopkart-backend    latest    sha256:...    163.4 MiB
shopkart-frontend   latest    sha256:...     50.7 MiB
```

Both images are now in K3s's containerd with `--namespace k8s.io`, so Kubernetes can see them.

---

## Stage 5 — Install NGINX Ingress Controller

```bash
kubectl get pods -n ingress-nginx 2>/dev/null | grep -q Running && echo "already installed" || {
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml
  kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=180s
}
```

**Expected at end:** `pod/ingress-nginx-controller-xxxxx condition met`

---

## Stage 6 — Deploy with Helm

The critical setting is `imagePullPolicy=Never` — this tells Kubernetes to use images already in containerd, not pull from a registry.

```bash
cd ~/Shopkart-3tier-devops

helm upgrade --install shopkart ./helm/shopkart \
  --namespace shopkart --create-namespace \
  --set backend.image.repository=shopkart-backend \
  --set backend.image.tag=latest \
  --set backend.image.pullPolicy=Never \
  --set frontend.image.repository=shopkart-frontend \
  --set frontend.image.tag=latest \
  --set frontend.image.pullPolicy=Never \
  --set postgres.auth.password=shopkart_pass \
  --set secrets.jwtSecret=dev_secret_at_least_32_chars_long \
  --set ingress.host=shopkart.local \
  --set hpa.enabled=false \
  --set frontend.env.BACKEND_URL=http://shopkart-backend:5000 \
  --set frontend.env.BACKEND_URL_METRICS=http://shopkart-backend:5000
```

**Note:** No `--wait` flag. Helm returns immediately.

---

## Stage 7 — Fix Frontend Security Context

The default chart uses `runAsNonRoot: true`, which prevents nginx from writing to `/etc/nginx/conf.d/` and `/run/nginx.pid`. This causes `CrashLoopBackOff`.

Workaround: allow the frontend to run as root (acceptable for a demo; for production, use emptyDir volumes).

```bash
# Wait for deployment to create pods
sleep 15

kubectl patch deployment shopkart-frontend -n shopkart --type=json -p='[
  {"op":"replace","path":"/spec/template/spec/containers/0/securityContext","value":{"runAsUser":0,"runAsNonRoot":false}}
]'
```

---

## Stage 8 — Wait for Pods

```bash
kubectl get pods -n shopkart -w
```

**Expected within ~60 seconds:**
```
shopkart-backend-xxxxx    1/1   Running
shopkart-backend-yyyyy    1/1   Running
shopkart-frontend-xxxxx   1/1   Running
shopkart-frontend-yyyyy   1/1   Running
shopkart-postgres-0       1/1   Running
```

Press `Ctrl+C` when all show `Running`.

---

## Stage 9 — Load Database Schema

```bash
cd ~/Shopkart-3tier-devops

# Apply schema
kubectl exec -i -n shopkart shopkart-postgres-0 -- \
  psql -U shopkart_user -d shopkart < database/schema.sql

# Apply seed data
kubectl exec -i -n shopkart shopkart-postgres-0 -- \
  psql -U shopkart_user -d shopkart < database/seed.sql

# Verify
kubectl exec -n shopkart shopkart-postgres-0 -- \
  psql -U shopkart_user -d shopkart -c "SELECT COUNT(*) FROM products;"
```

**Expected:** `15`

---

## Stage 10 — Verify the Backend

```bash
kubectl run curl-test --rm -it --restart=Never \
  --image=curlimages/curl -n shopkart -- \
  curl -fsS http://shopkart-backend:5000/api/health
```

**Expected:**
```json
{"status":"ok","timestamp":"...","uptime":...}
```

---

## Stage 11 — Access the Application

### Start port-forward

```bash
kubectl port-forward -n shopkart svc/shopkart-frontend 8080:80 --address 0.0.0.0
```

**Expected:**
```
Forwarding from 0.0.0.0:8080 -> 80
```

Leave this running (it blocks the terminal — that's correct).

### Expose port in Killercoda UI

1. Look at the top-right of the Killercoda page
2. Click **Traffic / Ports**
3. Enter port `8080`
4. Click **Access**

A new browser tab opens with ShopKart.

### Login credentials

| Role | Email | Password |
|---|---|---|
| User | user@shopkart.dev | User@123 |
| Admin | admin@shopkart.dev | Admin@123 |

Or click **Sign Up** to register a fresh account.

---

## Stage 12 — Test End-to-End

1. **Browse products** — 15 items across 7 categories
2. **Product details** — ratings, reviews, stock status
3. **Add to cart** — badge in navbar increments
4. **Checkout** — fill address, click "Pay (Simulated)"
5. **Order confirmation** — order number displayed
6. **Order history** — click your name → My Orders
7. **Admin dashboard** — login as admin to see stats

---

## Common Issues & Fixes

| Problem | Cause | Fix |
|---|---|---|
| `nerdctl: socket not found` | Wrong containerd path | `export CONTAINERD_ADDRESS=/run/containerd/containerd.sock` |
| `buildkitd: NoProcessSandbox requires Rootless` | Missing flag | Add `--rootless` |
| `buildctl: executable file not found` | BuildKit not installed | Reinstall BuildKit (Stage 2) |
| Frontend `CrashLoopBackOff` (permission denied) | Default securityContext | Run Stage 7 patch |
| `kubectl cp` fails | Killercoda's K3s quirk | Use `kubectl exec -i ... < file` instead |
| Backend `database: down` | Postgres slow to start | Wait 30s more, retry health check |
| Browser tab blank | Port-forward not exposed | Try port 9090 instead of 8080 |
| Session about to expire | 60-min limit | Take screenshots NOW, don't start new steps |

---

## Cleanup

Not required — Killercoda wipes everything at session end. But if you want to be tidy:

```bash
helm uninstall shopkart -n shopkart
kubectl delete namespace shopkart
```

---

## Lessons Learned

### What worked

- **nerdctl + BuildKit** is the reliable way to build Docker images inside Killercoda
- **`imagePullPolicy: Never`** is essential when using locally-built images
- **Helm with `--set` overrides** is cleaner than maintaining multiple values files for demos
- **`kubectl exec -i ... < file`** works better than `kubectl cp` for piping SQL files

### What didn't work

- **Building with plain `nerdctl build`** — requires BuildKit daemon
- **BuildKit default mode** — process sandbox blocked by outer container
- **Docker CLI** — not available in Killercoda
- **Frontend with `runAsNonRoot: true`** — nginx needs write access to config directories

### Improvements for the chart

To make this deployment work without the Stage 7 patch, the Helm chart should:

1. Add writable `emptyDir` volumes for `/etc/nginx/conf.d`, `/run`, and `/var/cache/nginx`
2. Or set `frontend.securityContext.runAsNonRoot: false` as a documented option
3. Or use a custom frontend entrypoint that pre-creates the needed directories

---

## Cheat Sheet — Copy-Paste Full Sequence

Save this block. Next time, paste it into a fresh Killercoda terminal and wait ~30 minutes.

```bash
# === Setup tools ===
export CONTAINERD_ADDRESS=/run/containerd/containerd.sock
cd /tmp
curl -fsSL "https://github.com/containerd/nerdctl/releases/download/v1.7.6/nerdctl-1.7.6-linux-amd64.tar.gz" | tar -xz nerdctl
mv nerdctl /usr/local/bin/ && chmod +x /usr/local/bin/nerdctl
curl -fsSL "https://github.com/moby/buildkit/releases/download/v0.16.0/buildkit-v0.16.0.linux-amd64.tar.gz" -o buildkit.tar.gz
tar -xzf buildkit.tar.gz
mv bin/buildctl bin/buildkitd /usr/local/bin/ && chmod +x /usr/local/bin/build*
mkdir -p /run/buildkit /tmp/buildkit-root
nohup buildkitd --addr unix:///run/buildkit/buildkitd.sock --root /tmp/buildkit-root --rootless --oci-worker-no-process-sandbox --oci-worker-snapshotter=native > /tmp/buildkitd.log 2>&1 &
sleep 5
export BUILDKIT_HOST=unix:///run/buildkit/buildkitd.sock

# === Clone ===
cd ~ && git clone https://github.com/An619/Shopkart-3tier-devops.git && cd Shopkart-3tier-devops

# === Build ===
nerdctl --namespace k8s.io build -t shopkart-backend:latest  ./backend
nerdctl --namespace k8s.io build -t shopkart-frontend:latest ./frontend

# === Ingress ===
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml
kubectl wait -n ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=180s

# === Deploy ===
helm upgrade --install shopkart ./helm/shopkart \
  -n shopkart --create-namespace \
  --set backend.image.repository=shopkart-backend --set backend.image.tag=latest --set backend.image.pullPolicy=Never \
  --set frontend.image.repository=shopkart-frontend --set frontend.image.tag=latest --set frontend.image.pullPolicy=Never \
  --set postgres.auth.password=shopkart_pass \
  --set secrets.jwtSecret=dev_secret_at_least_32_chars_long \
  --set ingress.host=shopkart.local \
  --set hpa.enabled=false \
  --set frontend.env.BACKEND_URL=http://shopkart-backend:5000 \
  --set frontend.env.BACKEND_URL_METRICS=http://shopkart-backend:5000

sleep 15
kubectl patch deployment shopkart-frontend -n shopkart --type=json \
  -p='[{"op":"replace","path":"/spec/template/spec/containers/0/securityContext","value":{"runAsUser":0,"runAsNonRoot":false}}]'

kubectl get pods -n shopkart -w
# Ctrl+C when all Running

kubectl exec -i -n shopkart shopkart-postgres-0 -- psql -U shopkart_user -d shopkart < database/schema.sql
kubectl exec -i -n shopkart shopkart-postgres-0 -- psql -U shopkart_user -d shopkart < database/seed.sql

kubectl port-forward -n shopkart svc/shopkart-frontend 8080:80 --address 0.0.0.0
# Then Killercoda UI → Traffic/Ports → 8080 → Access
```

---

## Related Documentation

- `docs/KILLERCODA.md` — user-facing deployment guide (initial version)
- `docs/AWS-EKS.md` — production deployment to AWS
- `docs/TERRAFORM.md` — infrastructure provisioning
- `docs/TROUBLESHOOTING.md` — general debugging
- `docs/ARCHITECTURE.md` — system design