terraform {
  required_version = "1.11.4"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "< 7.0.0"
      configuration_aliases = [
        google.destination
      ]
    }

    random = {
      source  = "hashicorp/random"
      version = ">= 2.1"
    }
  }
}

# Default provider is configured by Atmos for the source project
# Destination provider is used only when destination_project_id is set
provider "google" {
  alias   = "destination"
  project = var.destination_project_id
}
