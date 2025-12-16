terraform {
  required_version = "1.11.4"
  required_providers {
    sops = {
      source  = "carlpett/sops"
      version = "~> 0.5"
    }
    dotenv = {
      source  = "germanbrew/dotenv"
      version = "1.2.9"
    }
  }
}
