# Jenkins CI/CD — ShopKart

The pipeline is defined in the root `Jenkinsfile` and runs these stages:

1. Checkout
2. Install (backend + frontend in parallel)
3. Lint (backend + frontend)
4. Test (backend + frontend)
5. Build Frontend (vite build)
6. Docker Build (both images)
7. Trivy Scan (fails on CRITICAL)
8. Push to Docker Hub
9. Deploy (helm upgrade)
10. Verify (kubectl get pods/svc)

## Running Jenkins Locally

    docker build -t shopkart-jenkins ./jenkins

    docker run -d --name shopkart-jenkins \
      -p 8080:8080 -p 50000:50000 \
      -v jenkins_home:/var/jenkins_home \
      -v /var/run/docker.sock:/var/run/docker.sock \
      shopkart-jenkins

Open http://localhost:8080 — login `admin` / `admin`.

## Required Credentials

Manage Jenkins > Credentials > System > Global credentials.

### dockerhub-creds (Username with password)

- ID: `dockerhub-creds`
- Username: Docker Hub username
- Password: Docker Hub access token from https://hub.docker.com/settings/security

### kubeconfig-creds (Secret file)

- ID: `kubeconfig-creds`
- File: contents of `~/.kube/config`

### github-webhook-secret (Secret text)

- ID: `github-webhook-secret`
- Value: random hex string

## GitHub Webhook

Repo > Settings > Webhooks > Add webhook:

- Payload URL: `http://YOUR-JENKINS:8080/github-webhook/`
- Content type: `application/json`
- Secret: same as `github-webhook-secret`
- Events: Just the push event

## Environment Variables

| Variable | Source | Purpose |
|---|---|---|
| DOCKERHUB_USER | dockerhub-creds | Image namespace |
| IMAGE_TAG | BUILD_NUMBER + GIT_COMMIT | Unique tag |
| NAMESPACE | Jenkinsfile env | K8s namespace |
| RELEASE_NAME | Jenkinsfile env | Helm release name |

## Triggering

- Push to any branch runs install, lint, test, build
- Push to main also deploys via helm
- Manual: click Build Now

## Troubleshooting

| Symptom | Fix |
|---|---|
| docker: command not found | Mount /var/run/docker.sock |
| kubectl auth error | Re-upload kubeconfig-creds |
| helm upgrade fails | Chart path or values mismatch |
| Webhook 403 | Secret mismatch |
