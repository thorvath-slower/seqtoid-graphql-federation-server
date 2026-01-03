terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.45"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.16"
    }
    datadog = {
      source  = "datadog/datadog"
      version = ">= 3.20.0"
    }
  }
  # backend "s3" {
  #   # key    = "graphql.tfstate"
  #   bucket = "tfstate-491013321714-test"
  #   key    = "terraform/seqtoid-graphql/envs/dev/stack/happy.tfstate"
  #   //key = "graphql.tfstate"
  #   //encrypt = true
  #   region  = "us-west-2"
  #   profile = "idseq-newdev"
  # }
  required_version = ">= 1.3"
}
