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

# TODO: Remove in favor of database_credentials output once we move to stores
output "db_connection_name" {
  value     = module.database.connection_name
  sensitive = true
}

# TODO: Remove in favor of database_credentials output once we move to stores
output "database_user_name" {
  description = "The connection name for the created database"
  value       = module.database.database_user_name
  sensitive   = true
}

# TODO: Remove in favor of database_credentials output once we move to stores
output "database_user_password" {
  description = "The connection name for the created database"
  value       = module.database.database_user_password
  sensitive = true
}

output "database_credentials" {
  description = "A map of credential values for the created database"
  value       = {
    "connection_name" = module.database.connection_name
    "username" = module.database.database_user_name
    "password" = module.database.database_user_password
  }
  sensitive   = true
}
