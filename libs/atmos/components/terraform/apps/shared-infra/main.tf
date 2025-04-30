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

resource "google_service_account" "workflows" {
  account_id   = "shared-infra-workflows-sa"
  display_name = "Google Workflows Service Account for infrastructure shared between applications"
}

# Grant Cloud Storage Object User role to service account so it can read/write from/to GCS
resource "google_project_iam_member" "storageobjectuser" {
  project = var.project_id
  role    = "roles/storage.objectUser"
  member  = google_service_account.workflows.member
}

module "archive-files-wf" {
  project_id            = var.project_id
  region                = var.location
  source                = "../../vendor/google-workflows-workflow"
  service_account_email = google_service_account.workflows.email
  workflow_name         = "archive-files"
  workflow_source       = file("${path.module}/workflows/archive-files.workflows.yaml")
  workflow_description  = "Archives files from GCS bucket into an archive bucket with folders for each date"
}
