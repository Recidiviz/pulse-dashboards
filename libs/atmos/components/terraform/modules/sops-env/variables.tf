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

variable "secrets_dir" {
  type        = string
  description = <<-EOT
    Directory containing SOPS-encrypted env files. Pass an absolute path
    (typically "$${path.module}/environments") so file-existence checks work
    regardless of the Terraform working directory.
  EOT
}

variable "components" {
  type        = list(string)
  description = <<-EOT
    List of component/target names (e.g. ["server", "import", "migrate_db"]).
    For each component, files named env.<component><suffix> and
    env.<component>.<environment><suffix> will be loaded if they exist. Shared
    files (env<suffix>, env.<environment><suffix>) are decrypted once and
    reused across every component, so passing all components to a single
    module instance avoids redundant decryption and state bloat versus
    instantiating the module once per component.
  EOT
  default     = []
}

variable "environment" {
  type        = string
  description = <<-EOT
    Environment/configuration name (e.g. "staging", "production", "demo").
    When set, files named env.<environment><suffix> and
    env.<component>.<environment><suffix> will be loaded if they exist.
  EOT
  default     = null
}

variable "file_suffix" {
  type        = string
  description = "Suffix for SOPS-encrypted env files."
  default     = ".enc.yaml"
}
