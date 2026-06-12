# Typesense metrics → Google Managed Prometheus → Cloud Monitoring.
#
# Two GMP-scraped sources (managed_prometheus + the PodMonitoring CRD/collectors push to Cloud
# Monitoring as prometheus.googleapis.com/<metric>):
#   1) The operator's per-pod `metrics-exporter` sidecar — per-NODE typesense_metrics_*/typesense_stats_*.
#   2) A blackbox-exporter probing the healthcheck sidecar /readyz — quorum/health (probe_success).
#
# We don't use the operator's spec.metrics (in chart 0.4.x it deploys a Prometheus-Operator
# PodMonitor — a CRD absent on a GMP cluster), but the operator runs the exporter as a sidecar
# regardless, so we scrape that directly with a GMP PodMonitoring.

locals {
  # The operator's ClusterIP Service exposes the Typesense API (8108) and the healthcheck
  # sidecar (8808); confirmed via `kubectl -n typesense get svc`. Same Service the
  # GCPBackendPolicy / HealthCheckPolicy in typesense.tf target. Used by the blackbox probe.
  typesense_svc_host = "typesense-svc.${local.typesense_namespace}.svc.cluster.local"
}

# ---- 1) Resource + stats metrics: the operator's per-pod metrics-exporter sidecar ----
# TyKO runs a `metrics-exporter` sidecar in every Typesense pod, each scraping its own
# localhost:8108 — so scraping all of them yields PER-NODE typesense_metrics_*/typesense_stats_*
# (distinguished by the GMP pod resource label). Selector targets the StatefulSet pods; the
# endpoint targets the sidecar's named port `metrics` (container port 9100).
resource "kubectl_manifest" "typesense_sidecar_podmonitoring" {
  count = local.workload_count
  yaml_body = yamlencode({
    apiVersion = "monitoring.googleapis.com/v1"
    kind       = "PodMonitoring"
    metadata = {
      name      = "typesense-sidecar"
      namespace = kubernetes_namespace.typesense[0].metadata[0].name
    }
    spec = {
      selector = {
        matchLabels = { app = "typesense-sts" } # StatefulSet pod label (VERIFY per chart version)
      }
      endpoints = [
        {
          port     = "metrics" # metrics-exporter sidecar (9100)
          path     = "/metrics"
          interval = "30s"
        }
      ]
    }
  })

  depends_on = [kubectl_manifest.typesense_cluster]
}

# ---- 2) Quorum/health: blackbox probe of the healthcheck sidecar /readyz ----
# Kept as a standalone Deployment: the healthcheck sidecar serves JSON (not Prometheus), so we
# still need blackbox to turn /readyz into a probe_success gauge. Probing the Service hits any
# one pod, whose /readyz reports the aggregated cluster health.

# Custom blackbox module. /readyz returns HTTP 200 even with a node down (health is carried in the
# body as "cluster_health"), so probe_success must require the operator's own quorum verdict
# "cluster_health":true. fail_if_body_not_matches_regexp flips probe_success to 0 on quorum loss
# regardless of the HTTP status code — closing the silent-failure risk of the http_2xx module.
resource "kubernetes_config_map" "blackbox_config" {
  count = local.workload_count
  metadata {
    name      = "blackbox-exporter-config"
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
  }
  data = {
    "blackbox.yml" = yamlencode({
      modules = {
        typesense_readyz = {
          prober  = "http"
          timeout = "5s"
          http = {
            method                          = "GET"
            preferred_ip_protocol           = "ip4"
            fail_if_body_not_matches_regexp = ["\"cluster_health\":\\s*true"]
          }
        }
      }
    })
  }
}

resource "kubernetes_deployment" "blackbox_exporter" {
  count = local.workload_count
  metadata {
    name      = "blackbox-exporter"
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
    labels    = { app = "blackbox-exporter" }
  }

  spec {
    replicas = 1
    selector {
      match_labels = { app = "blackbox-exporter" }
    }
    template {
      metadata {
        labels = { app = "blackbox-exporter" }
      }
      spec {
        container {
          name  = "blackbox"
          image = var.blackbox_image
          args  = ["--config.file=/config/blackbox.yml"]

          port {
            name           = "http"
            container_port = 9115
          }

          volume_mount {
            name       = "config"
            mount_path = "/config"
            read_only  = true
          }

          resources {
            requests = { cpu = "20m", memory = "32Mi" }
            limits   = { cpu = "100m", memory = "64Mi" }
          }
        }

        volume {
          name = "config"
          config_map {
            name = kubernetes_config_map.blackbox_config[0].metadata[0].name
          }
        }
      }
    }
  }
}

# GMP scrapes the blackbox exporter's /probe, which probes the aggregated healthcheck /readyz.
# Uses the custom `typesense_readyz` module (above): probe_success=1 only when the body reports
# "cluster_health":true, so it flips to 0 on quorum loss even though /readyz still returns HTTP 200.
resource "kubectl_manifest" "typesense_health_podmonitoring" {
  count = local.workload_count
  yaml_body = yamlencode({
    apiVersion = "monitoring.googleapis.com/v1"
    kind       = "PodMonitoring"
    metadata = {
      name      = "typesense-healthcheck-probe"
      namespace = kubernetes_namespace.typesense[0].metadata[0].name
    }
    spec = {
      selector = {
        matchLabels = { app = "blackbox-exporter" }
      }
      endpoints = [
        {
          port     = "http"
          path     = "/probe"
          interval = "30s"
          params = {
            module = ["typesense_readyz"]
            target = ["http://${local.typesense_svc_host}:8808/readyz"]
          }
        }
      ]
    }
  })

  depends_on = [
    helm_release.typesense_operator,
    kubernetes_deployment.blackbox_exporter,
  ]
}
