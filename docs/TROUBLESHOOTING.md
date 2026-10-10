# Troubleshooting — ShopKart

## Kubernetes

### ImagePullBackOff

Symptom: pod can't pull the image.

Diagnose:

    kubectl describe pod -n shopkart <pod>
    kubectl get events -n shopkart --sort-by=.lastTimestamp

Cause: wrong image name, private registry auth missing, or local image not loaded.

Fix: verify image name/tag; set `imagePullPolicy: IfNotPresent` for local images; load into K3s with `k3s ctr images import`.

### CrashLoopBackOff

Symptom: pod restarts repeatedly.

Diagnose:

    kubectl logs -n shopkart <pod> --previous
    kubectl describe pod -n shopkart <pod>

Cause: missing env var, DB not reachable, bad config.

Fix: check ConfigMap keys, verify Postgres Service, verify Secret keys.

### Pending pods

Symptom: pod never schedules.

Diagnose:

    kubectl describe pod -n shopkart <pod>

Cause: insufficient resources, PVC unschedulable, taints.

Fix: reduce requests, check `kubectl get sc`, `kubectl describe nodes`.

### PVC Pending

Cause: no default StorageClass.

Fix:

    kubectl get sc
    # If local-path exists:
    kubectl patch sc local-path -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'

### Readiness probe failure

Cause: app not listening or path wrong.

Diagnose:

    kubectl describe pod -n shopkart <pod> | grep -A5 Readiness

Fix: check port and path; increase initialDelaySeconds if slow boot.

### Liveness probe killing pod

Cause: `/api/health` too slow or misconfigured.

Fix: increase `initialDelaySeconds` and `timeoutSeconds`.

### Service not reachable

Diagnose:

    kubectl get endpoints -n shopkart <svc>
    kubectl run curl-test --rm -it --image=curlimages/curl -n shopkart -- curl -v http://shopkart-backend:5000/api/health

Cause: selector mismatch, port mismatch.

Fix: verify Service `selector` matches Deployment labels.

### Ingress not routing

Diagnose:

    kubectl get pods -n ingress-nginx
    kubectl logs -n ingress-nginx <controller> --tail=50
    kubectl describe ingress -n shopkart shopkart-ingress

Cause: ingress class mismatch, host header wrong.

Fix: use `-H "Host: shopkart.local"` when testing.

## Docker / Docker Compose

### docker: command not found

Cause: Docker Desktop not installed or not in PATH.

Fix: install Docker Desktop, restart terminal.

### Port 5432/5000/8080 already in use

Diagnose:

    netstat -ano | findstr :8080     # Windows
    lsof -i :8080                    # Mac/Linux

Fix: stop the conflicting process or change host port in `docker-compose.yml`.

### Backend can't connect to Postgres

Symptom: backend logs show `ECONNREFUSED`.

Cause: postgres healthcheck not yet passing.

Fix: `docker compose logs postgres`, ensure `depends_on` uses `service_healthy`.

## Jenkins

### Webhook 403

Cause: secret mismatch.

Fix: regenerate `github-webhook-secret`, update both GitHub and Jenkins.

### Docker login failed in pipeline

Cause: bad Docker Hub credential.

Fix: update `dockerhub-creds` with a new access token.

### kubectl auth error

Cause: stale kubeconfig.

Fix: re-upload `kubeconfig-creds` with `aws eks update-kubeconfig` output.

### helm upgrade fails

Diagnose:

    helm status shopkart -n shopkart
    helm get values shopkart -n shopkart

Fix: check values, verify chart path.

## Terraform

### UnauthorizedOperation

Cause: insufficient IAM permissions.

Fix: verify with `aws sts get-caller-identity`; attach required policies.

### State lock stuck

Cause: previous run interrupted.

Fix: if using DynamoDB lock, remove the lock item manually; otherwise delete `.terraform.tfstate.lock.info`.

### Cluster never becomes ACTIVE

Cause: IAM role issue or subnet misconfig.

Fix: check `aws eks describe-cluster --name shopkart-eks --query cluster.status`.

## Application

### Login fails with seeded creds

Cause: seed.sql not applied, or bcrypt hashes mismatched.

Fix: re-run seed or register a fresh user.

### Products endpoint 500

Cause: DB schema missing or migration not applied.

Fix: verify tables exist; apply `database/schema.sql`.

### Frontend can't reach backend

Cause: nginx `BACKEND_URL` wrong, or CORS.

Fix: check nginx config `location /api/`; check backend logs for CORS errors.

## EKS

### Node NotReady

Diagnose:

    kubectl describe node <node>
    aws eks describe-nodegroup --cluster-name shopkart-eks --nodegroup-name shopkart-ng

Cause: CNI plugin not ready, or subnet has no IPs.

Fix: check `aws-node` DaemonSet pods in `kube-system`.

### Load balancer stuck Pending

Cause: ingress controller not installed, or AWS Load Balancer Controller missing.

Fix: use NodePort + port-forward for testing.
