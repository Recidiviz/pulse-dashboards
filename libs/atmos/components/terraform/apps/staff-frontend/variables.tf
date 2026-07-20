variable "project_id" {
  type        = string
  description = "The project the staff frontend serving infrastructure is deployed to"
}

variable "environment" {
  type        = string
  description = "Environment label used in resource names (staging, production)"
}

variable "domain_names" {
  type        = list(string)
  description = <<-EOT
    Domains served by the load balancer. The first entry is the primary (used
    by the classic managed cert during the Certificate Manager migration);
    additional entries are added at cutover time (e.g., the real dashboard
    domain alongside the dashboard-cdn test domain).
  EOT

  validation {
    condition     = length(var.domain_names) > 0
    error_message = "At least one domain is required."
  }
}

variable "bucket_name" {
  type        = string
  description = "Name of the private GCS bucket that holds the built staff frontend"
}

variable "deployer_members" {
  type        = list(string)
  description = "IAM principals (e.g., user:..., serviceAccount:...) allowed to upload builds and invalidate the CDN cache"
  default     = []
}

variable "asset_retention_days" {
  type        = number
  description = <<-EOT
    Age (days) after which bucket objects are deleted. Deploys re-upload every
    file with `gcloud storage cp`, resetting object age, so only files dropped
    from the build drift past this and get cleaned up. NOTE: this makes the live
    site depend on deploying at least once per this many days.
  EOT
  default     = 30
}
