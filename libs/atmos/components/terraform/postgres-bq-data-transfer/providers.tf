terraform {
  required_version = "1.11.4"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "< 7.0.0"
    }

    random = {
      source  = "hashicorp/random"
      version = ">= 2.1"
    }
  }
}
