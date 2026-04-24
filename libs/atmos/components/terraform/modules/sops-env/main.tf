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

# SOPS env file finder — the HCL analogue of plugins/repo/src/executors/utils.ts
# (`getSopsPathsForTask`). Given a secrets directory, an optional environment,
# and a list of components, loads the superset of candidate files from disk
# (each file decrypted at most once) and then merges per component in this
# priority order (lowest -> highest, so later keys win):
#
#   1. env<suffix>                           (base, shared by everything)
#   2. env.<component><suffix>               (all environments of one component)
#   3. env.<environment><suffix>             (all components of one environment)
#   4. env.<component>.<environment><suffix> (one component + environment)
#
# Usage:
#   module "envs" {
#     source      = "../../modules/sops-env"
#     secrets_dir = "${path.module}/environments"
#     environment = var.environment
#     components  = ["server", "import", "artifact_cleanup", "seed_demo"]
#   }
#
#   # module.envs.env_vars_by_component["server"] -> [{ name, value }, ...]

locals {
  has_environment = var.environment != null && var.environment != ""

  # Filename helpers. Empty string means "not applicable" and gets compacted out.
  base_filename = "env${var.file_suffix}"
  env_filename  = local.has_environment ? "env.${var.environment}${var.file_suffix}" : ""

  component_filename = {
    for c in var.components : c => "env.${c}${var.file_suffix}"
  }

  component_env_filename = {
    for c in var.components : c =>
    local.has_environment ? "env.${c}.${var.environment}${var.file_suffix}" : ""
  }

  # Deduplicated superset of every filename any component might use.
  candidate_filenames = toset(compact(concat(
    [local.base_filename, local.env_filename],
    values(local.component_filename),
    values(local.component_env_filename),
  )))

  existing_filenames = toset([
    for name in local.candidate_filenames : name
    if fileexists("${var.secrets_dir}/${name}")
  ])
}

# Decrypts each unique file exactly once, regardless of how many components
# reference it — this is the core anti-duplication optimization.
data "sops_file" "env" {
  for_each    = local.existing_filenames
  source_file = "${var.secrets_dir}/${each.value}"
}

locals {
  parsed = {
    for name in local.existing_filenames :
    name => yamldecode(data.sops_file.env[name].raw)
  }

  # Priority-ordered filenames (filtered to those actually on disk) per slice.
  base_ordered_filenames = [
    for name in compact([local.base_filename, local.env_filename]) : name
    if can(local.parsed[name])
  ]

  component_ordered_filenames = {
    for c in var.components : c => [
      for name in compact([
        local.base_filename,
        local.component_filename[c],
        local.env_filename,
        local.component_env_filename[c],
      ]) : name
      if can(local.parsed[name])
    ]
  }

  merged_env = merge([
    for name in local.base_ordered_filenames : local.parsed[name]
  ]...)

  merged_env_by_component = {
    for c in var.components : c => merge([
      for name in local.component_ordered_filenames[c] : local.parsed[name]
    ]...)
  }

  env_vars = nonsensitive([
    for key, value in local.merged_env : {
      name  = key
      value = sensitive(value)
    }
  ])

  env_vars_by_component = {
    for c, env in local.merged_env_by_component : c => nonsensitive([
      for key, value in env : {
        name  = key
        value = sensitive(value)
      }
    ])
  }
}
