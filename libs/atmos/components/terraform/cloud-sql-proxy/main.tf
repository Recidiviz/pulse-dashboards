
locals {
  cluster_name = "cloud-sql-proxy"
}
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
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

resource "google_container_cluster" "primary" {
  name     = local.cluster_name
  location = var.region

  network    = "default"
  subnetwork = "default"

  enable_l4_ilb_subsetting = true
  remove_default_node_pool = true
  initial_node_count       = 1

  ip_allocation_policy {}
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "cloud-sql-proxy-node-pool"
  cluster    = google_container_cluster.primary.name
  location   = var.region
  node_count = 1

  node_config {
    machine_type = "e2-medium"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}

provider "kubernetes" {
  host                   = google_container_cluster.primary.endpoint
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
}

data "google_client_config" "default" {}

resource "kubernetes_deployment" "cloud_sql_proxy" {
  metadata {
    name      = "cloud-sql-proxy"
    namespace = "default"
    labels = {
      app = "cloud-sql-proxy"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "cloud-sql-proxy"
      }
    }

    template {
      metadata {
        labels = {
          app = "cloud-sql-proxy"
        }
      }

      spec {
        container {
          name  = "cloud-sql-proxy"
          image = "gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.15.3"

          args = concat([
            "--address=0.0.0.0",
            "--structured-logs",
            "--credentials-file=/secrets/cloudsql/credentials.json"
            ], [
            for connection, port in var.sql_instance_connections :
            "${var.project_id}:${var.region}:${connection}?port=${port}"
          ])

          env {
            name  = "GOOGLE_APPLICATION_CREDENTIALS"
            value = "/secrets/cloudsql/credentials.json"
          }

          volume_mount {
            name       = "service-account"
            mount_path = "/secrets/cloudsql"
            read_only  = true
          }

          security_context {
            allow_privilege_escalation = false
          }
        }

        volume {
          name = "service-account"

          secret {
            secret_name = kubernetes_secret.service_account_token.metadata[0].name
          }
        }

        security_context {
          run_as_non_root = true
        }
      }
    }
  }
}

resource "kubernetes_service" "cloud_sql_proxy_service" {
  metadata {
    name      = "cloud-sql-proxy"
    namespace = "default"
    labels = {
      app = "cloud-sql-proxy"
    }
    annotations = {
      "cloud.google.com/load-balancer-type" : "Internal"
      "cloud.google.com/neg" = jsonencode(
        {
          ingress = true
        }
      )
    }
  }

  spec {
    type = "LoadBalancer"

    selector = {
      app = "cloud-sql-proxy"
    }

    # Expose sequential ports for each instance
    dynamic "port" {
      for_each = var.sql_instance_connections

      content {
        name        = "proxy-port-${port.key}"
        port        = port.value
        target_port = port.value
      }
    }

    load_balancer_ip = google_compute_address.internal_sql_proxy_ip.address
  }
}

resource "google_compute_address" "internal_sql_proxy_ip" {
  name         = "${local.cluster_name}-cloud-sql-proxy-ip"
  address_type = "INTERNAL"
  region       = var.region
  subnetwork   = "default"
  purpose      = "GCE_ENDPOINT"
}


resource "google_service_account" "proxy_agent" {
  account_id = "cloud-sql-proxy-agent"
}

resource "google_project_iam_member" "proxy_client" {
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.proxy_agent.email}"
  project = var.project_id
}

data "sops_file" "agent_private_key" {
  source_file = "./secrets/${var.project_id}.enc.yaml"
}

resource "kubernetes_secret" "service_account_token" {
  metadata {
    name = "cloud-sql-proxy-agent-key"
  }

  type = "Opaque"

  data = {
    "credentials.json" : data.sops_file.agent_private_key.data["agent_private_key"]
  }
}
