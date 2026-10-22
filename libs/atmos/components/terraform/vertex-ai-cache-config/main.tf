terraform {
  required_version = "1.11.4"
  required_providers {
    google = {
      source = "hashicorp/google"
      # google_vertex_ai_cache_config was added in 7.6.0. The app components pin
      # the provider below 7, which is why this setting has a component of its own.
      version = ">= 7.6.0"
    }
  }
}

# Vertex AI resources build regional endpoint URLs, so the provider needs a region.
provider "google" {
  project = var.project_id
  region  = var.region
}

# Turns off Vertex AI's caching of Gemini prompts, which otherwise keeps a prompt
# in memory for up to 24 hours, for the whole project. The provider cannot delete
# this setting, so removing this component only drops it from the state and
# leaves caching off.
resource "google_vertex_ai_cache_config" "default" {
  project       = var.project_id
  disable_cache = true
}
