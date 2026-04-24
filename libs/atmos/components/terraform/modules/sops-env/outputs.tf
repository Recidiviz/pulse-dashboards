# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
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

output "env" {
  description = "Merged key -> value map of just the base + environment files (no component dimension). Useful when the caller does not need per-component granularity."
  value       = local.merged_env
  sensitive   = true
}

output "env_vars" {
  description = "List of { name, value } pairs derived from `env`. Marked nonsensitive at the list level so it can be used with for_each; values remain sensitive."
  value       = local.env_vars
}

output "env_by_component" {
  description = "Map of component name -> merged env map (base + component + environment + component.environment)."
  value       = local.merged_env_by_component
  sensitive   = true
}

output "env_vars_by_component" {
  description = "Map of component name -> list of { name, value } pairs suitable for cloud-run env_vars."
  value       = local.env_vars_by_component
}

output "files_loaded" {
  description = "Filenames of SOPS files that were actually found and decrypted (each file is decrypted at most once)."
  value       = sort(tolist(local.existing_filenames))
}
