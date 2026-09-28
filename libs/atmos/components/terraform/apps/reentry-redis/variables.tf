variable "project_id" {
  type        = string
  description = "The project the Memorystore instance and its secrets are created in"
}

variable "location" {
  type        = string
  description = "The GCP region (us-central1, etc) the instance and secret replicas live in"
}

variable "environment" {
  type        = string
  description = "Environment suffix used in secret names, e.g. PROD produces RECIDIVIZ_REDIS_URL_PROD"

  validation {
    condition     = can(regex("^[A-Z]+$", var.environment))
    error_message = "environment must be upper case letters only, matching the existing *_PROD / *_STAGING secret names."
  }
}

variable "instance_name" {
  type        = string
  description = "The Memorystore instance name"
}

variable "network" {
  type        = string
  description = "The VPC network the instance is reachable from; Cloud Run services egress into this network"
  default     = "default"
}

variable "tier" {
  type        = string
  description = "BASIC (single node) or STANDARD_HA (replicated with automatic failover)"
}

variable "memory_size_gb" {
  type        = number
  description = "Instance memory in GiB"
}

variable "redis_version" {
  type        = string
  description = "Memorystore Redis version, e.g. REDIS_7_2"
}

variable "ca_cert_mount_path" {
  type        = string
  description = "Path the server CA secret is mounted at in Cloud Run; embedded in the URL as ssl_ca_certs"
  default     = "/secrets/redis/server-ca.pem"
}

variable "secret_accessors" {
  type        = set(string)
  description = "Service account emails that may read the URL and CA secrets (the Cloud Run services' and jobs' runtime accounts)"
}
