# Terraform — ShopKart AWS Infrastructure

The `terraform/` folder provisions:

- VPC (10.0.0.0/16)
- 2 public + 2 private subnets across 2 AZs
- Internet Gateway + NAT Gateway
- Route tables and associations
- IAM roles for EKS cluster and nodes
- EKS cluster (control plane)
- EKS managed node group (2 x t3.medium)
- OIDC provider (for IRSA)

## Files

| File | Purpose |
|---|---|
| versions.tf | Terraform + provider versions |
| providers.tf | AWS provider and default tags |
| variables.tf | Input variables |
| outputs.tf | Exported values |
| vpc.tf | VPC, subnets, IGW, NAT, routes |
| iam.tf | IAM roles and policy attachments |
| security-groups.tf | Cluster and node security groups |
| eks.tf | EKS cluster, node group, OIDC |
| terraform.tfvars.example | Example input values |

## Usage

    cd terraform
    cp terraform.tfvars.example terraform.tfvars
    # Edit terraform.tfvars for your environment

    terraform init
    terraform validate
    terraform plan -out=tfplan
    terraform apply tfplan

## After Apply

    aws eks update-kubeconfig --region us-east-1 --name shopkart-eks
    kubectl get nodes

## Destroy

    terraform destroy

Before destroying, delete any K8s LoadBalancer services so their ELBs are cleaned up by the controller, or manually delete orphaned ELBs in the AWS console.

## State

By default state is local (`terraform.tfstate`). For team use, configure a remote backend (S3 + DynamoDB lock) in `versions.tf`.

## Costs

Estimated hourly cost:

- EKS control plane: $0.10
- 2 x t3.medium: $0.08
- NAT Gateway: $0.045
- Load Balancer: $0.025
- Total: ~$0.25/hour (~$6/day)

Destroy when not in use.

## Common Issues

| Symptom | Fix |
|---|---|
| UnauthorizedOperation | Check AWS credentials/permissions |
| Subnet CIDR overlap | Adjust vpc_cidr or subnet cidrs |
| Node group fails to join | Check node IAM role attachments |
| kubectl timeout after apply | Wait ~3 minutes for the cluster to become ACTIVE |
