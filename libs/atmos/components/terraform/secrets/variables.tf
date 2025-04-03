variable "project_id" {
  type = string
  description = "Project to provision the secrets to"
}

variable "sops_file" {
  type = string
  description = "Path to SOPS file, relative to this component, to use for secrets"
}

variable "location" {
  type = string
  description = "Default location to store the secret"
}

variable "deletion_policy" {
  type = string
  default = "DELETE"
  description = "Default deletion policy"
}


variable "replication_overrides" {
  type = map(string)
  default = {}
  description = "Map of secret names to replication overrides for the secret (can set to auto or a different location)"
}

variable "deletion_policy_overrides" {
  type = map(string)
  default = {}
  description = "Map of secret names to deletion policy overrides for the secret"
}
