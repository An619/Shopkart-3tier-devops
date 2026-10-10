# Deploying ShopKart to AWS EKS

This guide takes ShopKart from Terraform provisioning to a running application on AWS EKS.

**Assumptions:** You have AWS CLI configured, Terraform 1.6+, kubectl, and helm installed.

**Cost warning:** A running EKS cluster costs roughly $0.10/hour for the control plane plus $0.04/hour per t3.medium node. Expect ~$0.30/hour total. Destroy when not in use.

---

## Overview

Terraform -> AWS VPC -> EKS -> Worker Nodes -> Kubernetes -> Helm -> ShopKart

---

## Step 1 — Provision the Infrastructure

    cd terraform
    cp terraform.tfvars.example terraform.tfvars
    # Edit terraform.tfvars to match your environment

    terraform init
    terraform validate
    terraform plan -out=tfplan
    terraform apply tfplan

This creates:

- VPC with 2 public and 2 private subnets across 2 AZs
- Internet Gateway and NAT Gateway
- EKS cluster (control plane)
- Managed node group (2 x t3.medium by default)
- IAM roles for cluster and nodes

Takes ~15 minutes.

---

## Step 2 — Configure kubectl

    aws eks update-kubeconfig --region us-east-1 --name shopkart-eks

Verify:

    kubectl get nodes
    kubectl get pods -A

---

## Step 3 — Install NGINX Ingress Controller

For AWS, use the AWS Load Balancer Controller instead of NGINX to provision an ALB. But for simplicity and portability, we use NGINX Ingress with a LoadBalancer Service:

    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/aws/deploy.yaml

Wait for the LoadBalancer to get an external hostname:

    kubectl get svc -n ingress-nginx ingress-nginx-controller -w

Look for `EXTERNAL-IP` to become an ELB hostname.

---

## Step 4 — Install Metrics Server (for HPA)

    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

Verify:

    kubectl top nodes

---

## Step 5 — Get Your Images into a Registry

Option A — Push to Docker Hub:

    docker login
    docker build -t YOUR_DOCKERHUB_USER/shopkart-backend:latest ./backend
    docker build -t YOUR_DOCKERHUB_USER/shopkart-frontend:latest ./frontend
    docker push YOUR_DOCKERHUB_USER/shopkart-backend:latest
    docker push YOUR_DOCKERHUB_USER/shopkart-frontend:latest

Option B — Use Amazon ECR:

    aws ecr create-repository --repository-name shopkart-backend
    aws ecr create-repository --repository-name shopkart-frontend

    ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    REGION=us-east-1

    aws ecr get-login-password --region $REGION | \
      docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com

    docker tag shopkart-backend:latest $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/shopkart-backend:latest
    docker tag shopkart-frontend:latest $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/shopkart-frontend:latest

    docker push $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/shopkart-backend:latest
    docker push $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/shopkart-frontend:latest

---

## Step 6 — Deploy with Helm

    cd ~/projects/shopkart-3tier-devops

    helm upgrade --install shopkart ./helm/shopkart \
      --namespace shopkart --create-namespace \
      --set backend.image.repository=YOUR_DOCKERHUB_USER/shopkart-backend \
      --set backend.image.tag=latest \
      --set frontend.image.repository=YOUR_DOCKERHUB_USER/shopkart-frontend \
      --set frontend.image.tag=latest \
      --set postgres.auth.password=change_me_strong_password \
      --set secrets.jwtSecret=change_me_long_random_string \
      --set ingress.host=shopkart.example.com \
      --wait --timeout 10m

Verify:

    helm list -n shopkart
    kubectl get pods -n shopkart
    kubectl get svc -n shopkart
    kubectl get ingress -n shopkart

---

## Step 7 — Point DNS to the Load Balancer

Get the ALB/NLB hostname:

    kubectl get svc -n ingress-nginx ingress-nginx-controller

Copy the `EXTERNAL-IP` value. In Route 53 (or your DNS provider):

1. Create an A record (alias) for `shopkart.example.com`
2. Point it at the load balancer hostname

Or test without DNS:

    INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    echo "$INGRESS_IP"
    curl -H "Host: shopkart.example.com" http://$INGRESS_IP/api/health

---

## Step 8 — Test the Application

    INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

    curl -fsS -H "Host: shopkart.example.com" http://$INGRESS_IP/api/health
    curl -fsS -H "Host: shopkart.example.com" http://$INGRESS_IP/api/products

Login with seeded credentials:

    Admin: admin@shopkart.dev / Admin@123
    User:  user@shopkart.dev  / User@123

---

## Step 9 — Autoscaling Test

Watch the backend scale under load:

    kubectl get hpa -n shopkart -w

In another terminal, generate load:

    kubectl run -it --rm load-generator --image=busybox -n shopkart -- \
      /bin/sh -c "while true; do wget -q -O- http://shopkart-backend:5000/api/health; done"

Watch the HPA increase replicas, then stop the load and watch them scale back down.

---

## Step 10 — Update and Rollback

    helm upgrade shopkart ./helm/shopkart -n shopkart --set backend.image.tag=v2
    helm rollback shopkart 1 -n shopkart

---

## Cleanup — Destroy Everything

    helm uninstall shopkart -n shopkart

    # Ensure the ingress controller's LoadBalancer is deleted (avoids orphan ELB)
    kubectl delete -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/aws/deploy.yaml

    cd terraform
    terraform destroy

Check for leftovers:

    aws elbv2 describe-load-balancers --region us-east-1
    aws ec2 describe-instances --filters "Name=tag:Project,Values=shopkart"

If any exist, delete manually.

---

## Common Issues

### Nodes NotReady

    kubectl describe node <node>
    aws eks describe-nodegroup --cluster-name shopkart-eks --nodegroup-name shopkart-ng

### LoadBalancer stuck Pending

The AWS Load Balancer Controller may not be installed. Easiest fix:

    kubectl describe svc -n ingress-nginx ingress-nginx-controller
    # Look at events

Or fall back to NodePort and test via port-forward.

### Pods stuck ContainerCreating

    kubectl describe pod -n shopkart <pod-name>
    # Usually CNI or subnet issue

### ELB not deleted after destroy

Manually delete leftover load balancers in the AWS console, then `terraform destroy` again.

---

## Cost Estimate

| Resource | Cost/hour | Cost/day |
|---|---|---|
| EKS control plane | $0.10 | $2.40 |
| 2 x t3.medium nodes | $0.08 | $2.00 |
| NAT Gateway | $0.045 | $1.08 |
| Load balancer | $0.025 | $0.60 |
| Data transfer | varies | varies |
| **Total** | **~$0.25** | **~$6** |

Destroy the cluster when not actively testing.

---

## Next Steps

- Monitoring: see `docs/MONITORING.md`
- Troubleshooting: see `docs/TROUBLESHOOTING.md`
- Interview prep: see `docs/INTERVIEW-QUESTIONS.md`