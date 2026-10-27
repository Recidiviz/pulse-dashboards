
locals {
  cluster_name = "cloud-sql-proxy"
}
terraform {
  required_version = "1.11.4"
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

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

# Without a dedicated account the nodes run as the Compute Engine default
# service account, which holds roles/editor, and any pod can fetch its token
# from the metadata server.
resource "google_service_account" "node" {
  account_id   = "cloud-sql-proxy-node"
  display_name = "cloud-sql-proxy GKE nodes"
}

resource "google_project_iam_member" "node_default" {
  project = var.project_id
  role    = "roles/container.defaultNodeServiceAccount"
  member  = "serviceAccount:${google_service_account.node.email}"
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "cloud-sql-proxy-node-pool"
  cluster    = google_container_cluster.primary.name
  location   = var.region
  node_count = 1

  depends_on = [google_project_iam_member.node_default]

  network_config {
    enable_private_nodes = true
  }

  node_config {
    machine_type = "e2-medium"

    # Changing the service account replaces the node pool, which takes the
    # single proxy node, and the connectivity it provides, down for a few
    # minutes.
    service_account = google_service_account.node.email

    # Serves pods the GKE metadata server, which hides the node's credentials.
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    # Required by org policy constraints/compute.requireShieldedVm.
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }
}

provider "kubernetes" {
  host                   = "https://${google_container_cluster.primary.endpoint}"
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
          image = "gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.25.4"

          args = concat([
            "--address=0.0.0.0",
            "--structured-logs",
            "--credentials-file=/secrets/cloudsql/credentials.json",
            "--private-ip"
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
