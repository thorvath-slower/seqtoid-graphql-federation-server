locals {
  magic_stack_name = module.secrets.values.magic_stack_name
  alb_name         = module.secrets.values.alb_name
  service_type     = var.stack_name == local.magic_stack_name ? "TARGET_GROUP_ONLY" : "INTERNAL"
  routing_config   = {
    "INTERNAL" = {},
    "TARGET_GROUP_ONLY" = {
      path = "/graphqlfed*",
      alb = {
        name          = local.alb_name,
        listener_port = 443,
      }
    }
  }
}

module "secrets" {
  source = "github.com/chanzuckerberg/cztack//aws-ssm-params?ref=v0.40.0"

  project = "czid"
  env     = "sandbox"
  service = "graphql-federation"

  parameters = ["magic_stack_name", "alb_name"]
}

module "stack" {
  source           = "git@github.com:chanzuckerberg/happy//terraform/modules/happy-stack-eks?ref=happy-stack-eks-v4.27.1"
  image_tag        = var.image_tag
  image_tags       = jsondecode(var.image_tags)
  stack_name       = var.stack_name
  deployment_stage = var.env
  stack_prefix     = "/${var.stack_name}"
  app_name         = var.app
  k8s_namespace    = var.k8s_namespace
  services = {
    gql = merge(local.routing_config[local.service_type], {
      name              = "graphql-federation"
      port              = "4444"
      memory            = "8000Mi"
      memory_requests   = "8000Mi"
      cpu               = "3000m"
      cpu_requests      = "3000m"
      health_check_path = "/health"
      // INTERNAL - OIDC protected ALB
      // EXTERNAL - external ALB
      // PRIVATE - cluster IP only, no ALB at all
      // TARGET_GROUP_ONLY - Only create a target group for use with an existing ALB
      service_type          = local.service_type
      platform_architecture = "arm64"
    })
  }
}
