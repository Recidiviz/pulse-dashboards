# =============================================================================
# Typesense workload (operator CRs + supporting k8s/GCP resources).
#
# VERIFY-AGAINST-OPERATOR: several fields below depend on the exact TyKO chart
# version pinned in var.operator_chart_version — specifically the CRD apiVersion,
# the TypesenseCluster spec field names, and the labels/Service name the operator
# applies to the StatefulSet pods (used by the PDB, HealthCheckPolicy, and
# GCPBackendPolicy). After the first `helm_release` apply, run:
#   kubectl get crd | grep -i typesensecluster
#   kubectl explain typesensecluster.spec
#   kubectl -n typesense get svc,pods --show-labels
# and reconcile the values marked "VERIFY" below. See README.md.
# =============================================================================

# Read the bootstrap admin API key from the SOPS-encrypted secrets file.
data "sops_file" "secrets" {
  source_file = "${path.module}/secrets/${var.project_id}.enc.yaml"
}

# StorageClass that provisions zonal pd-ssd disks encrypted with our CMEK key.
# Zonal (not regional) disks are sufficient because Raft replicates data across
# the three nodes; WaitForFirstConsumer binds each PV in its pod's zone.
resource "kubernetes_storage_class_v1" "typesense_cmek" {
  count = local.workload_count
  metadata {
    name = "typesense-cmek-ssd"
  }
  storage_provisioner    = "pd.csi.storage.gke.io"
  reclaim_policy         = "Retain"
  volume_binding_mode    = "WaitForFirstConsumer"
  allow_volume_expansion = true

  parameters = {
    type                      = "pd-ssd"
    "disk-encryption-kms-key" = google_kms_crypto_key.pd.id
  }
}

# Bootstrap admin API key Secret consumed by the TypesenseCluster.
resource "kubernetes_secret" "typesense_admin_api_key" {
  count = local.workload_count
  metadata {
    name      = "typesense-admin-api-key"
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
  }
  type = "Opaque"
  data = {
    # VERIFY: TyKO expects the admin key under this Secret key.
    "typesense-api-key" = data.sops_file.secrets.data["typesense_admin_api_key"]
  }
}

# The Typesense cluster: a 3-node Raft quorum, one pod per zone, exposed through
# the GKE Gateway, with the aggregated healthcheck sidecar enabled.
resource "kubectl_manifest" "typesense_cluster" {
  count = local.workload_count
  yaml_body = yamlencode({
    # VERIFY apiVersion against the installed CRD (ts.opentelekomcloud.com vs typesense.io).
    apiVersion = "ts.opentelekomcloud.com/v1alpha1"
    kind       = "TypesenseCluster"
    metadata = {
      name      = "typesense"
      namespace = kubernetes_namespace.typesense[0].metadata[0].name
    }
    spec = {
      replicas = local.replica_count
      image    = var.typesense_image

      adminApiKey = {
        name = kubernetes_secret.typesense_admin_api_key[0].metadata[0].name
      }

      # CORS for browser clients: the staff dashboard search bar calls Typesense directly
      enableCors  = length(var.cors_domains) > 0
      corsDomains = join(",", var.cors_domains)

      # Extra Typesense server settings, mounted by the operator as `envFrom` on the typesense-server
      # Environment variables listed here will be set so long as they don't conflict with builtin
      # operator settings i.e. the operator sets `TYPESENSE_ENABLE_CORS` via the `enableCors` flag
      additionalServerConfiguration = {
        name = kubernetes_config_map.typesense_configuration[0].metadata[0].name
      }

      storage = {
        size             = var.data_disk_size
        storageClassName = kubernetes_storage_class_v1.typesense_cmek[0].metadata[0].name
        accessMode       = "ReadWriteOnce"
      }

      resources = var.typesense_resources

      # One pod per zone so a single zone loss never costs more than one quorum member.
      # The selector MUST match the operator's StatefulSet pod label (app=typesense-sts) — with the
      # wrong label this DoNotSchedule constraint matches nothing and is silently inert (which let
      # two pods' zonal PVs collide in one zone).
      topologySpreadConstraints = [
        {
          maxSkew           = 1
          topologyKey       = "topology.kubernetes.io/zone"
          whenUnsatisfiable = "DoNotSchedule"
          labelSelector = {
            matchLabels = {
              app = "typesense-sts"
            }
          }
        }
      ]

      # NOTE: the operator's Prometheus exporter (spec.metrics) is intentionally NOT used.
      # In chart 0.4.2 it requires spec.metrics.release and deploys a Prometheus-Operator
      # PodMonitor (monitoring.coreos.com/v1) — a CRD absent on this Google Managed
      # Prometheus cluster. Resource metrics are instead collected by a standalone exporter
      # scraped via a GMP PodMonitoring (see metrics.tf).

      # Deploy the aggregated healthcheck sidecar (port 8808: /livez, /readyz). Its /readyz
      # is bridged into Cloud Monitoring via the blackbox probe in metrics.tf for a
      # quorum/health signal. VERIFY the field casing against the installed CRD.
      healthCheck = {}

      # Expose via the GKE Gateway created below (Gateway API).
      httpRoutes = [
        {
          name = "typesense"
          parentRef = {
            name      = "typesense"
            namespace = kubernetes_namespace.typesense[0].metadata[0].name
          }
          hostnames = [var.hostname]
        }
      ]
    }
  })

  depends_on = [
    helm_release.typesense_operator,
    kubernetes_storage_class_v1.typesense_cmek,
    kubernetes_secret.typesense_admin_api_key,
    kubernetes_config_map.typesense_configuration,
    google_kms_crypto_key_iam_member.pd,
    kubectl_manifest.typesense_gateway,
  ]
}

# Protect quorum during voluntary disruptions (node drains, upgrades): never let
# more than one of the three members be evicted at a time.
resource "kubernetes_pod_disruption_budget_v1" "typesense" {
  count = local.workload_count
  metadata {
    name      = "typesense"
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
  }
  spec {
    min_available = 2
    selector {
      match_labels = {
        # Must match the operator's StatefulSet pod label (confirmed via --show-labels). With the
        # wrong label the PDB matches 0 pods and silently protects nothing.
        app = "typesense-sts"
      }
    }
  }

  depends_on = [kubectl_manifest.typesense_cluster]
}

# GKE Gateway (regional external Application LB) bound to our static IP and the
# Certificate Manager cert map. The operator's httpRoutes attach to this Gateway.
resource "kubectl_manifest" "typesense_gateway" {
  count = local.workload_count
  yaml_body = yamlencode({
    apiVersion = "gateway.networking.k8s.io/v1"
    kind       = "Gateway"
    metadata = {
      name      = "typesense"
      namespace = kubernetes_namespace.typesense[0].metadata[0].name
    }
    spec = {
      gatewayClassName = "gke-l7-regional-external-managed"
      addresses = [
        {
          type  = "NamedAddress"
          value = google_compute_address.typesense.name
        }
      ]
      listeners = [
        {
          name     = "https"
          protocol = "HTTPS"
          port     = 443
          # Google-managed TLS via a Certificate Manager REGIONAL cert. On a regional
          # Gateway the cert is referenced in the listener's tls.options (NOT a Gateway
          # annotation), and tls.mode must be Terminate — otherwise the controller errors
          # with GWCER106 "no certificates specified for protocol HTTPS".
          tls = {
            mode = "Terminate"
            options = {
              "networking.gke.io/cert-manager-certs" = google_certificate_manager_certificate.typesense[0].name
            }
          }
        }
      ]
    }
  })

  depends_on = [
    helm_release.typesense_operator,
    google_compute_address.typesense,
    google_certificate_manager_certificate.typesense,
  ]
}

# Attach the Cloud Armor (WAF) policy to the Typesense backend.
resource "kubectl_manifest" "typesense_backend_policy" {
  count = local.workload_count
  yaml_body = yamlencode({
    apiVersion = "networking.gke.io/v1"
    kind       = "GCPBackendPolicy"
    metadata = {
      name      = "typesense"
      namespace = kubernetes_namespace.typesense[0].metadata[0].name
    }
    spec = {
      default = {
        securityPolicy = google_compute_region_security_policy.typesense[0].name

        # Enable LB backend-service request logging. Cloud Armor decisions are
        # emitted ONLY as part of these request logs — without this, the policy's
        # advanced_options_config.log_level = "VERBOSE" (exposure.tf) has nothing to
        # attach to and no WAF/firewall logs appear. sampleRate is an integer that
        # GKE divides by 1000000; 1000000 = 100%, so every request (and every WAF
        # denial) is logged. Lower it if request-log volume becomes a concern.
        logging = {
          enabled    = true
          sampleRate = 1000000
        }
      }
      targetRef = {
        group = ""
        kind  = "Service"
        # The operator's ClusterIP Service (exposes 8108 + 8808); confirmed via
        # `kubectl -n typesense get svc`.
        name = "typesense-svc"
      }
    }
  })

  depends_on = [kubectl_manifest.typesense_cluster]
}

# Health check the LB backend against Typesense's /health endpoint.
resource "kubectl_manifest" "typesense_health_check" {
  count = local.workload_count
  yaml_body = yamlencode({
    apiVersion = "networking.gke.io/v1"
    kind       = "HealthCheckPolicy"
    metadata = {
      name      = "typesense"
      namespace = kubernetes_namespace.typesense[0].metadata[0].name
    }
    spec = {
      default = {
        config = {
          type = "HTTP"
          httpHealthCheck = {
            requestPath = "/health"
            port        = 8108
          }
        }
      }
      targetRef = {
        group = ""
        kind  = "Service"
        # The operator's ClusterIP Service (exposes 8108 + 8808); confirmed via
        # `kubectl -n typesense get svc`.
        name = "typesense-svc"
      }
    }
  })

  depends_on = [kubectl_manifest.typesense_cluster]
}
