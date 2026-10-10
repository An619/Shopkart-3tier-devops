# Deploying ShopKart on Killercoda (Free Kubernetes Playground)

This guide walks through deploying the full ShopKart stack on **Killercoda's free Kubernetes playground** — no AWS account required.

**Target environment:** Single-node Kubernetes cluster (K3s) with NGINX Ingress pre-installed.

**Time required:** ~20 minutes.

**Reference:** https://killercoda.com/playgrounds/scenario/kubernetes

---

## Prerequisites

Before starting, ensure you have:

1. A GitHub account with the ShopKart repo pushed (or ability to clone it)
2. A Docker Hub account with `shopkart-frontend` and `shopkart-backend` images pushed (or build them in Killercoda — see Step 3)
3. The Killercoda Kubernetes playground open in a browser tab

**Important:** Killercoda sessions expire after 60 minutes. If your session ends, you lose everything except what's on GitHub. Plan accordingly.

---

## Step 1 — Open Killercoda

1. Go to https://killercoda.com/playgrounds/scenario/kubernetes
2. Sign in with GitHub
3. Wait for the terminal prompt: `~$`

Verify the cluster:

    kubectl get nodes
    kubectl get storageclass
    kubectl get pods -A

You should see one node (Ready), a `local-path` storage class, and the `kube-system` pods.

---

## Step 2 — Verify Tools

    kubectl version --client
    git --version
    helm version

If `helm` is missing, install it:

    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    helm version

Check that NGINX Ingress is present:

    kubectl get pods -n ingress-nginx

If it isn't installed:

    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml
    kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=180s

---

## Step 3 — Get the Code and Images

Option A — Clone from GitHub:

    cd ~
    git clone https://github.com/An619/Shopkart-3tier-devops.git
    cd Shopkart-3tier-devops

Option B — If Docker is available, build images locally:

    docker build -t shopkart-backend:latest ./backend
    docker build -t shopkart-frontend:latest ./frontend

If Docker is NOT available in Killercoda (common), import the prebuilt images from Docker Hub:

    docker pull YOUR_DOCKERHUB_USER/shopkart-backend:latest
    docker pull YOUR_DOCKERHUB_USER/shopkart-frontend:latest

If Docker isn't available at all, skip this step. In Step 5 you will need to change the image names in the manifests to point at Docker Hub.

Load images into K3s (if Docker is available):

    docker save shopkart-backend:latest | k3s ctr images import -
    docker save shopkart-frontend:latest | k3s ctr images import -

Verify images are in containerd:

    k3s ctr images ls | grep shopkart

---

## Step 4 — Create the Namespace

Option A — Apply the raw manifests (quick):

    cd ~/Shopkart-3tier-devops
    kubectl apply -f k8s/namespace.yaml

Option B — Use kustomize (recommended):

    kubectl apply -k k8s/

---

## Step 5 — Deploy Postgres

    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secret.yaml
    kubectl apply -f k8s/database/service.yaml
    kubectl apply -f k8s/database/statefulset.yaml

Wait for the pod:

    kubectl get pods -n shopkart -w
    # Ctrl+C when shopkart-postgres-0 is Running

Apply the schema and seed:

    kubectl exec -n shopkart -it shopkart-postgres-0 -- psql -U shopkart_user -d shopkart -f /docker-entrypoint-initdb.d/01-schema.sql || true

Note: The StatefulSet template doesn't mount the SQL files by default. To load schema manually, copy the file into the pod:

    kubectl cp database/schema.sql shopkart/shopkart-postgres-0:/tmp/schema.sql
    kubectl cp database/seed.sql shopkart/shopkart-postgres-0:/tmp/seed.sql
    kubectl exec -n shopkart -it shopkart-postgres-0 -- psql -U shopkart_user -d shopkart -f /tmp/schema.sql
    kubectl exec -n shopkart -it shopkart-postgres-0 -- psql -U shopkart_user -d shopkart -f /tmp/seed.sql

Verify:

    kubectl exec -n shopkart -it shopkart-postgres-0 -- psql -U shopkart_user -d shopkart -c "SELECT COUNT(*) FROM products;"

---

## Step 6 — Deploy Backend

    kubectl apply -f k8s/backend/service.yaml
    kubectl apply -f k8s/backend/deployment.yaml

Wait for pods:

    kubectl get pods -n shopkart -l app=shopkart-backend -w

Check backend logs if not starting:

    kubectl logs -n shopkart -l app=shopkart-backend --tail=50

Test the backend from inside the cluster:

    kubectl run curl-test --rm -it --image=curlimages/curl -n shopkart -- \
      curl -fsS http://shopkart-backend:5000/api/health

---

## Step 7 — Deploy Frontend

    kubectl apply -f k8s/frontend/service.yaml
    kubectl apply -f k8s/frontend/deployment.yaml

Wait for pods:

    kubectl get pods -n shopkart -l app=shopkart-frontend -w

---

## Step 8 — Apply Ingress

    kubectl apply -f k8s/ingress.yaml

Check the ingress:

    kubectl get ingress -n shopkart

Get the ingress IP:

    kubectl get svc -n ingress-nginx ingress-nginx-controller

Killercoda exposes ingress on the node. Use the node's external IP or the "Traffic / Ports" panel in the Killercoda UI.

---

## Step 9 — Apply HPA

    kubectl apply -f k8s/hpa.yaml
    kubectl get hpa -n shopkart

Note: HPA requires metrics-server. Verify with:

    kubectl top nodes

If metrics-server is missing, install it:

    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

Then patch it for K3s (self-signed certs):

    kubectl patch deployment metrics-server -n kube-system --type=json \
      -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

---

## Step 10 — Alternative: Deploy with Helm

If you prefer Helm over raw manifests:

    helm install shopkart ./helm/shopkart \
      -n shopkart --create-namespace \
      --set backend.image.repository=YOUR_DOCKERHUB_USER/shopkart-backend \
      --set backend.image.tag=latest \
      --set frontend.image.repository=YOUR_DOCKERHUB_USER/shopkart-frontend \
      --set frontend.image.tag=latest \
      --set postgres.auth.password=shopkart_pass

Check the release:

    helm list -n shopkart
    kubectl get pods -n shopkart

Render templates without installing (for debugging):

    helm template shopkart ./helm/shopkart -n shopkart

---

## Step 11 — Access the Application

Port-forward for local testing:

    kubectl port-forward -n shopkart svc/shopkart-frontend 8080:80

Then in the Killercoda UI, use the "Traffic / Ports" panel to expose port 8080.

Or use the ingress if you set up /etc/hosts:

    echo "127.0.0.1 shopkart.local" >> /etc/hosts

Then access http://shopkart.local via the ingress controller.

---

## Step 12 — Test the Application

Verify the API:

    curl -fsS http://localhost:5000/api/health

Or from inside the cluster:

    kubectl run curl-test --rm -it --image=curlimages/curl -n shopkart -- \
      curl -fsS http://shopkart-backend:5000/api/products

Test login credentials:

    Admin: admin@shopkart.dev / Admin@123
    User:  user@shopkart.dev  / User@123

---

## Step 13 — Common Issues

### ImagePullBackOff

Cause: image not found or not loaded into K3s containerd.

Diagnose:

    kubectl describe pod -n shopkart <pod-name>
    kubectl get events -n shopkart --sort-by=.lastTimestamp

Fix:

- If using local images: load with `k3s ctr images import`
- If using Docker Hub: verify the image name and tag in the deployment
- Set `imagePullPolicy: IfNotPresent` for local images

### CrashLoopBackOff

Cause: backend can't connect to Postgres, or missing env vars.

Diagnose:

    kubectl logs -n shopkart <pod-name> --previous

Fix:

- Check ConfigMap keys match what the app expects
- Verify Secret has `DB_PASSWORD` and `JWT_SECRET`
- Verify Postgres Service name matches `shopkart-postgres`

### Pods Pending

Cause: insufficient resources or unschedulable PVC.

Diagnose:

    kubectl describe pod -n shopkart <pod-name>

Fix:

- Reduce resource requests in the deployment
- Check storage class with `kubectl get sc`

### PVC Pending

Cause: no default storage class.

Fix:

    kubectl get sc
    kubectl patch storageclass local-path -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'

### Ingress not reachable

Diagnose:

    kubectl get pods -n ingress-nginx
    kubectl logs -n ingress-nginx <controller-pod>

Fix:

- Wait for the ingress controller pod to be Running
- Use port-forward as a fallback

### Readiness probe failing

Diagnose:

    kubectl describe pod -n shopkart <pod-name> | grep -A5 "Readiness"

Fix:

- Verify `/api/health` (backend) and `/healthz` (frontend) respond inside the pod
- Increase `initialDelaySeconds` if the app is slow to boot

---

## Step 14 — Cleanup

Remove everything:

    helm uninstall shopkart -n shopkart   # if installed via Helm
    kubectl delete -k k8s/                 # if applied with kustomize
    kubectl delete namespace shopkart      # if applied directly

Verify:

    kubectl get all -n shopkart

---

## Step 15 — Time Management Tips

Killercoda sessions expire after 60 minutes. To avoid losing work:

1. Push all code to GitHub before starting Killercoda
2. Do not edit files inside Killercoda — only apply manifests
3. If a session ends mid-deployment, just re-clone and re-apply
4. Use `kubectl get pods -n shopkart -w` to monitor, then `Ctrl+C` before the timeout

---

## Summary

By the end of this guide you will have:

- A running PostgreSQL StatefulSet with seeded data
- Backend Deployment (2 replicas) serving the REST API
- Frontend Deployment (2 replicas) serving the React SPA
- NGINX Ingress routing /api to backend and / to frontend
- HPA autoscaling the backend
- Access to the app from a browser via port-forward or the ingress

The exact same manifests and Helm chart deploy to AWS EKS in Phase 12.

---

## Next Steps

- See `docs/AWS-EKS.md` for the AWS production deployment
- See `docs/TERRAFORM.md` for provisioning the cluster
- See `docs/TROUBLESHOOTING.md` for deeper debugging