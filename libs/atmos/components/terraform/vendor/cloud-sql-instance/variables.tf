# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2025 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================

# The project for the related database instance
variable "project_id" {
  type = string
}

# The project for the related database instance
variable "create_bigquery_connection" {
  type = bool
  default = true
}

# The a string key for the database instance, e.g. "state" or "justice_counts".
variable "instance_key" {
  type = string
}

# The base name for our database-related secrets per `recidiviz.persistence.database.sqlalchemy_engine_manager`
variable "base_secret_name" {
  type = string
}

# Postgres database version
# See also https://cloud.google.com/sql/docs/postgres/create-instance#create-2nd-gen
variable "database_version" {
  type    = string
  default = "POSTGRES_13"
}

# If true, a readonly user will be created from the configured `readonly` secrets
variable "has_readonly_user" {
  type = bool
}

# Preferred region for the instance
variable "region" {
  type = string
}

# Preferred vCPU/Memory tier for the instance
# See also https://cloud.google.com/sql/docs/postgres/create-instance#machine-types
variable "tier" {
  type = string
}

# Preferred availability zone for the instance
variable "zone" {
  type = string
}

variable "secondary_zone" {
  type    = string
  default = null
}

variable "additional_databases" {
  type    = set(string)
  default = []
}

variable "insights_config" {
  type = object({
    query_insights_enabled  = optional(bool)
    query_string_length     = optional(number)
    record_application_tags = optional(bool)
    record_client_address   = optional(bool)
  })
  default = null
}
