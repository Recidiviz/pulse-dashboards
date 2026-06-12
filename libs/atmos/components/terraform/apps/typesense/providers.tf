terraform {
  required_version = "1.11.4"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = "~> 1.14"
    }
    sops = {
      source  = "carlpett/sops"
      version = "~> 0.5"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# The Kubernetes-facing providers are configured in-component against the cluster
# we create in this same apply (same pattern as components/terraform/cloud-sql-proxy).
#
# When var.mode == "standby" the cluster is count=0 — the providers fall back to
# stub values and are never actually invoked (every k8s resource is also count=0).
# Terraform doesn't allow conditional provider blocks, so this is the standard
# pattern for "cluster may not exist yet" components.
#
# The try() catches the "index out of range" error when count=0 — using one() with
# an empty splat returns null (not an error), and try() doesn't catch nulls, so
# string interpolation/base64decode would still blow up. Direct [0] indexing
# does throw the error try() needs.
locals {
  cluster_endpoint = try(google_container_cluster.primary[0].endpoint, "")
  cluster_ca_b64   = try(google_container_cluster.primary[0].master_auth[0].cluster_ca_certificate, "")
  k8s_host         = local.cluster_endpoint != "" ? "https://${local.cluster_endpoint}" : "https://localhost"
  k8s_ca           = local.cluster_ca_b64 != "" ? base64decode(local.cluster_ca_b64) : ""
}

provider "kubernetes" {
  host                   = local.k8s_host
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = local.k8s_ca
}

provider "helm" {
  kubernetes {
    host                   = local.k8s_host
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = local.k8s_ca
  }
}

provider "kubectl" {
  host                   = local.k8s_host
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = local.k8s_ca
  load_config_file       = false
}
