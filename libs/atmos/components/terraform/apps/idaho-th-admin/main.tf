# Standalone Cloud Run deployment of recidiviz-data's shared admin panel
# image, scoped to Idaho TH. Reads/writes the existing Idaho TH Cloud SQL DB
# (owned by apps/idaho-th); creates no database, migration, or seed job.

# This component doesn't own the Cloud SQL instance (unlike apps/idaho-th /
# apps/cpa-labeling, which read .connection_name off their own resource), so
# the connection name is read straight from the pre-existing secret.
data "google_secret_manager_secret_version" "cloudsql_instance_id" {
  secret  = "${var.sql_base_secret_name}_cloudsql_instance_id"
  version = "latest"
}

# apps/idaho-th owns INTERCOM_TOKEN; IdahoThIntercomClient expects a
# differently-named secret, so the value is copied below instead of
# duplicated by hand.
data "google_secret_manager_secret_version" "intercom_token" {
  secret  = "INTERCOM_TOKEN"
  version = "latest"
}

# Direct VPC Egress subnet created by apps/idaho-th's own network.tf — this
# app shares the same pre-existing Cloud SQL instance, so its server needs the
# same private path once the instance's public IP is disabled.
data "google_compute_subnetwork" "direct_egress_existing" {
  count = var.enable_private_db_egress ? 1 : 0

  project = var.project_id
  name    = var.direct_egress_subnetwork_name
  region  = var.location
}

locals {
  vpc_network = "projects/${var.project_id}/global/networks/default"

  # Cloud Run's vpc_access.network_interfaces.subnetwork wants the relative
  # form (projects/*/regions/*/subnetworks/*), not a subnetwork's .self_link
  # attribute, which is a full https://www.googleapis.com/compute/... URL.
  direct_db_egress_vpc_access = var.enable_private_db_egress ? {
    egress = "PRIVATE_RANGES_ONLY"
    network_interfaces = {
      network    = local.vpc_network
      subnetwork = "projects/${var.project_id}/regions/${var.location}/subnetworks/${data.google_compute_subnetwork.direct_egress_existing[0].name}"
    }
  } : null

  # Pre-existing secrets, created out-of-band (apps/idaho-th only reads
  # them too). Names must match IDAHO_TH_STAGING_DB_SECRET_PREFIX (staging) /
  # SchemaType.IDAHO_TH's prefix (prod).
  idaho_th_sql_secret_ids = toset([
    "${var.sql_base_secret_name}_db_user",
    "${var.sql_base_secret_name}_db_password",
    "${var.sql_base_secret_name}_cloudsql_instance_id",
    # Value unused, fetch just has to succeed (see accessor below); grouped
    # with the other three so one owner has the whole idaho_th_dev_* family.
    "${var.sql_base_secret_name}_db_host",
  ])

  cloudsql_connection_name = data.google_secret_manager_secret_version.cloudsql_instance_id.secret_data

  server_container_image = coalesce(
    var.server_container_image,
    "${var.location}-docker.pkg.dev/${var.artifact_registry_project_id}/${var.artifact_registry_repository_id}/idaho-th-admin-server:${var.server_container_version}",
  )
}

resource "google_service_account" "default" {
  account_id   = var.service_account_id
  display_name = "Idaho TH Admin Panel Service Account"
}

resource "google_project_iam_member" "cloudsqlclient" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# server.py queries the Cloud Run Admin API for its own metadata at import
# time (CloudRunMetadata.build_from_metadata_server), needing read access to
# itself.
resource "google_project_iam_member" "cloudrunviewer" {
  project = var.project_id
  role    = "roles/run.viewer"
  member  = "serviceAccount:${google_service_account.default.email}"
}

resource "google_project_iam_member" "logwriter" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# Reads @idaho-th's Segment data from the recidiviz-123 BigQuery project.
# Query jobs run and are billed to recidiviz_data; read access to recidiviz-123
# is granted separately on that project's side. This grant only allows the
# service account to create query jobs in recidiviz_data.
resource "google_project_iam_member" "bigqueryjobuser" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# Dedicated repo, separate from the public app's "idaho-th" repo, for
# independent retention (reader IAM below is still project-wide). Not created
# when create_registry is false — see that variable's description.
resource "google_artifact_registry_repository" "admin_panel" {
  count = var.create_registry ? 1 : 0

  project       = var.artifact_registry_project_id
  location      = var.location
  repository_id = var.artifact_registry_repository_id
  format        = "DOCKER"
  description   = "Idaho TH admin panel images (recidiviz-data), separate from the public app's idaho-th repo"
}

resource "google_project_iam_member" "artifactregistryreader" {
  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.default.email}"
}

resource "google_project_service_identity" "cloudrun" {
  count = var.grant_artifact_registry_cloudrun_agent_iam ? 1 : 0

  provider = google-beta

  project = var.project_id
  service = "run.googleapis.com"
}

resource "google_project_iam_member" "cloudrunserviceagentartifactregistryreader" {
  count = var.grant_artifact_registry_cloudrun_agent_iam ? 1 : 0

  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_project_service_identity.cloudrun[0].email}"
}

resource "google_secret_manager_secret_iam_member" "idaho_th_sql_secret_accessor" {
  for_each = local.idaho_th_sql_secret_ids

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.default.email}"
}

# Owned by this component, unlike the sql secrets above: this creates a new
# secret with a copied value instead of referencing an existing one.
resource "google_secret_manager_secret" "idaho_th_intercom_token" {
  secret_id = "idaho_th_intercom_token"

  replication {
    user_managed {
      replicas {
        location = var.location
      }
    }
  }
}

resource "google_secret_manager_secret_version" "idaho_th_intercom_token" {
  secret      = google_secret_manager_secret.idaho_th_intercom_token.id
  secret_data = data.google_secret_manager_secret_version.intercom_token.secret_data
}

resource "google_secret_manager_secret_iam_member" "idaho_th_intercom_token_accessor" {
  secret_id = google_secret_manager_secret.idaho_th_intercom_token.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.default.email}"
}

# Consumed by recidiviz-data's
# build_compute_engine_auth_decorator(LOAD_BALANCER_SERVICE_ID_SECRET_NAME) —
# same name the shared admin panel uses; project-scoped Secret Manager avoids
# collision with its recidiviz-staging/recidiviz-123 secret. Populated once
# the LB's backend service exists (load_balancer.tf).
resource "google_secret_manager_secret" "iap_backend_service_id" {
  secret_id = "iap_admin_panel_load_balancer_service_id"

  replication {
    user_managed {
      replicas {
        location = var.location
      }
    }
  }
}

resource "google_secret_manager_secret_version" "iap_backend_service_id" {
  secret      = google_secret_manager_secret.iap_backend_service_id.id
  secret_data = module.lb_http.backend_services["default"].generated_id
}

resource "google_secret_manager_secret_iam_member" "iap_backend_service_id_accessor" {
  secret_id = google_secret_manager_secret.iap_backend_service_id.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.default.email}"
}

# IAP enabled via Terraform doesn't auto-grant the IAP service agent Cloud
# Run Invoker like the Console toggle does — the LB's NEG can't invoke this
# service without it (run.routes.invoke denied). Granted via the module's
# `members` below, scoped to just this agent.
resource "google_project_service_identity" "iap_sa" {
  provider = google-beta
  project  = var.project_id
  service  = "iap.googleapis.com"
}

module "server" {
  source = "../../vendor/cloud-run"

  project_id                    = var.project_id
  location                      = var.location
  service_name                  = var.server_name
  service_account               = google_service_account.default.email
  cloud_run_deletion_protection = false
  ingress                       = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  service_scaling = {
    min_instance_count = var.server_min_instance_count
  }
  template_scaling = {
    min_instance_count = var.server_min_instance_count
    max_instance_count = var.server_max_instance_count
  }

  vpc_access = local.direct_db_egress_vpc_access

  members = ["serviceAccount:${google_project_service_identity.iap_sa.email}"]

  containers = [
    {
      container_image = local.server_container_image
      # Entrypoint override only applies to the real image — a placeholder
      # (var.server_container_image set, e.g. bootstrap apply before any
      # image is pushed) has no Python/uv/gunicorn and would crash under it.
      container_command = var.server_container_image == null ? ["sh"] : null
      container_args = var.server_container_image == null ? [
        "-c",
        join(" ", [
          "uv", "run", "gunicorn",
          "-c", "gunicorn.conf.py",
          # Overrides recidiviz-data's gunicorn.conf.py, whose cpu_count()-based
          # worker count sees the Cloud Run host's CPUs, not this container's limit.
          "-w", tostring(var.server_gunicorn_workers),
          "-b", ":$PORT",
          "--log-file=-",
          "recidiviz.admin_panel.server:app",
        ])
      ] : null

      env_vars = [
        {
          name  = "RECIDIVIZ_ENV"
          value = var.recidiviz_env
        },
        # AssetGenerationClient reads this eagerly at import
        # (server.py -> all_routes.py -> line_staff_tools.py); Idaho TH never
        # uses the routes that need it. Fake value (RFC 2606 .invalid) —
        # confirm with team if real report generation is ever needed.
        {
          name  = "ASSET_GENERATION_URL"
          value = "https://asset-generation.invalid"
        },
        # LineageStore builds the full platform BigQuery view DAG at
        # startup, dominating cold-start latency. Idaho TH has no lineage
        # tab, so skip it — see recidiviz.admin_panel.admin_stores.
        {
          name  = "ADMIN_PANEL_SKIP_LINEAGE_STORE"
          value = "true"
        },
        # CMEK key idaho_th_metrics_queries.py sets as the
        # destination_encryption_configuration on its BigQuery query jobs
        # (see bigquery-results.tf) -- this resource name is generated by
        # Cloud KMS Autokey and can't be computed in Python, so it's passed
        # in directly here.
        {
          name  = "IDAHO_TH_QUERY_JOBS_KMS_KEY"
          value = google_kms_key_handle.query_jobs.kms_key
        },
      ]

      resources = {
        limits = {
          cpu    = var.server_cpu
          memory = var.server_memory
        }
        # Each new instance imports the full recidiviz-data codebase before
        # /health passes; extra CPU during startup shortens that window.
        startup_cpu_boost = true
      }

      startup_probe = {
        initial_delay_seconds = 0
        period_seconds        = 10
        timeout_seconds       = 5
        failure_threshold     = 24

        http_get = {
          path = "/health"
        }
      }

      volume_mounts = [{
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }]
    }
  ]

  volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [local.cloudsql_connection_name]
    }
  }]
}
