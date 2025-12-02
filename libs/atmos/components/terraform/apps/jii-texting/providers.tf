terraform {
  required_version = "1.11.4"

  required_providers {
    sops = {
      source  = "carlpett/sops"
      version = "~> 0.5"
    }

    google = {
      source  = "hashicorp/google"
      version = "< 7.0.0"
    }
  }
}
