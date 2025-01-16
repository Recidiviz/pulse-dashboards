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

output "cloudsql_instance_id" {
  value = data.google_secret_manager_secret_version.cloudsql_instance_id.secret_data
  sensitive = true
}

output "connection_name" {
  value = google_sql_database_instance.data.connection_name
}

output "default_database_name" {
  value = "postgres"
}

output "database_user_name" {
  value = google_sql_user.postgres.name
  sensitive = true
}

output "database_user_password" {
  value     = google_sql_user.postgres.password
  sensitive = true
}

output "instance_name" {
  value = google_sql_database_instance.data.name
  sensitive = true
}

output "region" {
  value = var.region
}

output "readonly_database_user_name" {
  value = var.has_readonly_user ? data.google_secret_manager_secret_version.db_readonly_user[0].secret_data : null
  sensitive = true
}

output "readonly_database_password" {
  value = var.has_readonly_user ? data.google_secret_manager_secret_version.db_readonly_password[0].secret_data : null
  sensitive = true
}
