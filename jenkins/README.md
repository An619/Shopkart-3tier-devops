# Jenkins — ShopKart CI/CD

This folder contains everything needed to run Jenkins locally and wire it up to the ShopKart pipeline.

## Contents

| File | Purpose |
|---|---|
| Dockerfile | Jenkins LTS + Docker CLI + kubectl + helm |
| plugins.txt | Jenkins plugins to pre-install |
| casc/jenkins.yaml | Jenkins Configuration as Code |
| ../Jenkinsfile | The declarative pipeline itself |

## Run Jenkins Locally

Build and run:

    docker build -t shopkart-jenkins ./jenkins
    docker run -d --name shopkart-jenkins \
      -p 8080:8080 -p 50000:50000 \
      -v jenkins_home:/var/jenkins_home \
      -v /var/run/docker.sock:/var/run/docker.sock \
      shopkart-jenkins

Open http://localhost:8080 — login as admin / admin.

## Required Jenkins Credentials

Create these in Manage Jenkins > Credentials > System > Global credentials:

### 1. dockerhub-creds (Username with password)

- ID: dockerhub-creds
- Username: your Docker Hub username
- Password: a Docker Hub access token from https://hub.docker.com/settings/security

### 2. kubeconfig-creds (Secret file)

- ID: kubeconfig-creds
- File: your ~/.kube/config (from aws eks update-kubeconfig or Killercoda)

### 3. github-webhook-secret (Secret text)

- ID: github-webhook-secret
- Value: a random hex string like the output of: openssl rand -hex 20

## GitHub Webhook

1. Repo > Settings > Webhooks > Add webhook
2. Payload URL: http://YOUR-JENKINS-HOST:8080/github-webhook/
3. Content type: application/json
4. Secret: same value as github-webhook-secret
5. Events: Just the push event
6. Save

## Pipeline Stages

    Checkout -> Install -> Lint -> Test -> Build Frontend -> Docker Build
    -> Trivy Scan -> Push to Docker Hub -> Helm Deploy -> Verify

## Triggering

- Push to any branch: install, lint, test, build
- Push to main: full pipeline including deploy
- Manual: click "Build Now" for one-off runs

## Troubleshooting

| Symptom | Fix |
|---|---|
| docker: command not found | Ensure Docker socket is mounted |
| kubectl auth error | Re-upload kubeconfig-creds |
| helm upgrade fails | Chart path or values mismatch |
| Webhook 403 | Secret mismatch between GitHub and Jenkins |