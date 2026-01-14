locals {
  bootstrap_sa_id    = "bootstrap-ci-cd-deployment"
  bootstrap_sa_email = "${local.bootstrap_sa_id}@${var.project_id}.iam.gserviceaccount.com"
  bootstrap_pool_id  = "bootstrap-pool"
}

# Create the bootstrap service account
resource "google_service_account" "bootstrap" {
  account_id   = local.bootstrap_sa_id
  display_name = "Bootstrap Deployment Service Account"
  description  = "Service account for fetching deployment service account secrets from GCS"
  project      = var.project_id
}

# Grant Secret Manager access to read deployment secrets
resource "google_project_iam_member" "secret_manager_access" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.bootstrap.email}"

  condition {
    title       = "Restrict to deployment secrets"
    description = "Only allow access to deployment service account secrets"
    expression  = "resource.name.startsWith('projects/${var.project_id}/secrets/atmos_deployment-service-accounts')"
  }
}

# Grant service account token creator role for impersonation
resource "google_project_iam_member" "token_creator" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.bootstrap.email}"
}

# Create a workload identity pool for bootstrapping
resource "google_iam_workload_identity_pool" "bootstrap_pool" {
  workload_identity_pool_id = local.bootstrap_pool_id
  display_name              = "CI/CD Bootstrap Pool"
  description               = "Bootstrap workload identity pool for CI / CD"
}

# Create workload identity provider for GitHub Actions
resource "google_iam_workload_identity_pool_provider" "github_bootstrap" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.bootstrap_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-bootstrap"
  display_name                       = "GitHub Bootstrap Provider"
  description                        = "Bootstrap provider for GitHub Actions"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }

  attribute_condition = "assertion.repository=='${var.repository}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Bind the bootstrap SA to workload identity
resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.bootstrap.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.bootstrap_pool.name}/attribute.repository/${var.repository}"
}

# Grant management of dsa service accounts
resource "google_project_iam_member" "dsa_service_account_admin" {
  project = var.project_id
  role    = "roles/iam.serviceAccountAdmin"
  member  = "serviceAccount:${google_service_account.bootstrap.email}"

  condition {
    title       = "Restrict to dsa- service accounts"
    description = "Only allows management of service accounts starting with dsa-"
    expression  = "resource.name.startsWith('projects/${var.project_id}/serviceAccounts/dsa-')"
  }
}

# Grant Terraform state bucket access
resource "google_project_iam_member" "terraform_state_access" {
  project = var.project_id
  role    = "roles/storage.objectUser"
  member  = "serviceAccount:${google_service_account.bootstrap.email}"

  condition {
    title      = "Terraform State Access"
    expression = "resource.name.startsWith('projects/_/buckets/${var.project_id}-tf-state')"
  }
}

# Grant project IAM admin permissions
resource "google_project_iam_member" "project_iam_admin" {
  project = var.project_id
  role    = "roles/resourcemanager.projectIamAdmin"
  member  = "serviceAccount:${google_service_account.bootstrap.email}"
}

# Grant storage admin for terraform state bucket
resource "google_storage_bucket_iam_member" "terraform_state_admin" {
  bucket = "${var.project_id}-tf-state"
  role   = "roles/storage.admin"
  member = "serviceAccount:${google_service_account.bootstrap.email}"
}

# Grant workload identity pool admin
resource "google_project_iam_member" "workload_identity_pool_admin" {
  project = var.project_id
  role    = "roles/iam.workloadIdentityPoolAdmin"
  member  = "serviceAccount:${google_service_account.bootstrap.email}"
}

# Grant secret manager admin for atmos secrets
resource "google_project_iam_member" "atmos_secret_manager_admin" {
  project = var.project_id
  role    = "roles/secretmanager.admin"
  member  = "serviceAccount:${google_service_account.bootstrap.email}"

  condition {
    title      = "Atmos secrets access"
    expression = "resource.name.startsWith('projects/_/secrets/atmos_')"
  }
}