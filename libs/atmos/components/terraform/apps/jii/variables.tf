variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to"
}

variable "sql_instance_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "jii"
}

variable "sql_base_secret_name" {
  type        = string
  description = "The name of the SQL secret prefixes"
  default     = "jii"
}

variable "database_availability_type" {
  type        = string
  description = "The availability type for the service"
  default     = null
}

variable "database_secondary_zone" {
  type        = string
  description = "The secondary zone for the service"
  default     = null
}

variable "private_network" {
  type        = string
  description = "(Optional_ The private network to use for the SQL instance"
  default     = null
}
