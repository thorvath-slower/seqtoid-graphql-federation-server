module "stack" {
  source           = "git@github.com:chanzuckerberg/happy//terraform/modules/happy-stack-eks?ref=happy-stack-eks-v4.27.1"
  image_tag        = var.image_tag
  image_tags       = jsondecode(var.image_tags)
  stack_name       = var.stack_name
  deployment_stage = "dev"
  stack_prefix     = "/${var.stack_name}"
  k8s_namespace    = "czid-dev-happy-happy-env"
  app_name         = var.app
  additional_env_vars = {
    API_URL = "https://sandbox.czid.org"
    NEXTGEN_ENTITIES_URL = "http://ryan-test-entities.czid-dev-happy-happy-env.svc.cluster.local:8008"
    NEXTGEN_WORKFLOWS_URL = "http://workflows.czidnet"
  }
  services = {
    gql = {
      name              = "gql-federation",
      desired_count     = 1,
      port              = 4444,
      memory            = "8000Mi"
      memory_requests   = "8000Mi"
      cpu               = "3000m"
      cpu_requests      = "3000m"
      health_check_path = "/health",
      service_type      = "INTERNAL",
      // INTERNAL - OIDC protected ALB
      // EXTERNAL - external ALB
      // PRIVATE - cluster IP only, no ALB at all
      // TARGET_GROUP_ONLY - Only create a target group for use with an existing ALB
      platform_architecture = "arm64",
    }
  }
  tasks = {
  }
}
