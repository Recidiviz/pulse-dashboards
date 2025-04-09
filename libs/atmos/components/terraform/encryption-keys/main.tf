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

variable "name" {
  type = string
}

variable "location" {
  type = string
  default = "us-central1"
}

resource "google_kms_key_ring" "keyring" {
  name     = "application-keys"
  location = var.location
}

resource "google_kms_crypto_key" "encryption-key" {
  name            = var.name
  purpose         = "ASYMMETRIC_DECRYPT"
  key_ring        = google_kms_key_ring.keyring.id

  version_template {
    # this is choice recommended by Google
    algorithm = "RSA_DECRYPT_OAEP_3072_SHA256"
  }

  lifecycle {
    prevent_destroy = true
  }
}

