module "cloud-run" {
  source = "../../vendor/cloud-run"

  service_name = "jii-proxy-server"
  location     = var.location
  project_id   = var.project_id

  containers = [
    {
      container_image = "${var.artifact_registry_repo}/jii-proxy-server:${var.server_version}"
    }
  ]

  members = var.members
}
