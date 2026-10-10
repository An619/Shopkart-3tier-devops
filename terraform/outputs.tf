output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "EKS cluster CA data (base64)"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "node_group_name" {
  description = "EKS managed node group name"
  value       = aws_eks_node_group.main.node_group_name
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "update_kubeconfig_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
