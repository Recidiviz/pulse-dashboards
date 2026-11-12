# =============================================================================
# Provider config for the staff-synthetic-monitor Cloud Function.
# =============================================================================
terraform {
  required_version = "1.11.4"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    # TFLint doesn't count the ephemeral "sops_file" in main.tf as a use.
    # tflint-ignore: terraform_unused_required_providers
    sops = {
      source = "carlpett/sops"
      # >= 1.3 for the `ephemeral "sops_file"` resource (keeps decrypted
      # credentials out of Terraform state).
      version = "~> 1.3"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
