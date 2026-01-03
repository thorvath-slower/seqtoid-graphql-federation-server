provider "aws" {
  region = "us-west-2"
  # assume_role {
  #   role_arn = "arn:aws:iam::${var.aws_account_id}:role/${var.aws_role}"
  # }
  profile = "idseq-newdev"
  allowed_account_ids = [var.aws_account_id]
}

# provider "aws" {
#   alias  = "czi-si"
#   region = "us-west-2"
#
#   assume_role {
#     role_arn = "arn:aws:iam::626314663667:role/tfe-si"
#   }
#   # profile = "idseq-newdev"
#   allowed_account_ids = ["626314663667", var.aws_account_id]
# }

data "aws_eks_cluster" "cluster" {
  name = var.k8s_cluster_id
}

data "aws_eks_cluster_auth" "cluster" {
  name = var.k8s_cluster_id
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
  # api_version = nil
  # kind = nil
  # name = nil
  # namespace = nil
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = ["eks", "get-token", "--cluster-name", var.k8s_cluster_id, "--profile", "idseq-newdev"]
  }
  # token                  = data.aws_eks_cluster_auth.cluster.token
}

data "kubernetes_namespace" "happy-namespace" {
  metadata {
    name = var.k8s_namespace
  }
}

data "kubernetes_secret" "integration_secret" {
  metadata {
    name      = "integration-secret"
    namespace = var.k8s_namespace
  }
}

# data "aws_ssm_parameter" "dd_app_key" {
#   name     = "/shared-infra-prod-datadog/app_key"
#   provider = aws.czi-si
# }
# data "aws_ssm_parameter" "dd_api_key" {
#   name     = "/shared-infra-prod-datadog/api_key"
#   provider = aws.czi-si
# }

provider "datadog" {
  app_key = "" // data.aws_ssm_parameter.dd_app_key.value
  api_key = "" // data.aws_sso_parameter.dd_api_key.value
  validate = false
}
