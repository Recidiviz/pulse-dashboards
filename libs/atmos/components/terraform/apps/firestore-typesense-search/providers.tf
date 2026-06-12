# =============================================================================
# Provider config for the firestore-typesense-search Firebase extension.
#
# google_firebase_extensions_instance lives in google-beta, so both providers
# are wired here even though the only resource is the extension instance.
# =============================================================================
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
    sops = {
      source  = "carlpett/sops"
      version = "~> 0.5"
    }
  }
}

provider "google" {
  project = var.project_id
}

provider "google-beta" {
  project = var.project_id
}
