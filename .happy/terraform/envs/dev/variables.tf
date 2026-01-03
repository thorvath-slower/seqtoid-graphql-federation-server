variable "app" {
  type        = string
  description = "Application name"
  default     = "seqtoid-graphql-federation-server"
}

variable "aws_account_id" {
  type        = string
  description = "AWS account ID to apply changes to"
  default     = "491013321714"
}

# variable "aws_role" {
#   type        = string
#   description = "Name of the AWS role to assume to apply changes"
# }

variable "env" {
  type        = string
  description = "Environment name"
  default     = "dev"
}

# variable "happymeta_" {
#   type        = string
#   description = "Happy Path metadata. Ignored by actual terraform."
# }

variable "image_tag" {
  type        = string
  description = "Please provide an image tag"
  default = "v5" # TODO: Change this when redeploying the GraphqlServer Image with a new version
}

variable "image_tags" {
  type        = string
  description = "Override the default image tags (json-encoded map)"
  default     = "{}"
}

variable "k8s_cluster_id" {
  type        = string
  description = "EKS K8S Cluster ID"
  default = "czid-dev-eks"
}

variable "k8s_namespace" {
  type        = string
  description = "K8S namespace for this stack"
  default = "czid-dev-happy-happy-env"
}

variable "stack_name" {
  type        = string
  description = "Happy Path stack name"
  default = "seqtoid-gql"
}
