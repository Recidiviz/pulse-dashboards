// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

export const GCS_REQUIRED_ENV_KEYS = [
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_PROJECT_ID",
  "IDAHO_TH_PDF_GCS_BUCKET",
] as const;

export const GCS_PDF_CONTENT_TYPE = "application/pdf" as const;

/** Max object size for inline base64 read fallback in local dev (not an upload limit). */
export const MAX_INLINE_READ_BYTES = 10 * 1024 * 1024;

// Allows slash-delimited segments of alphanumerics/_/-/.; rejects empty
// segments and any `.`/`..` traversal segment so a key can't escape its prefix.
export const GCS_OBJECT_KEY_REGEX =
  /^(?!\.\.?(?:\/|$))(?!.*\/\.\.?(?:\/|$))[a-zA-Z0-9_\-.]+(?:\/[a-zA-Z0-9_\-.]+)*$/;

export const GCS_VALIDATION_CRC32C = "crc32c" as const;

export const GCS_SIGNED_READ_EXPIRY_MS = 15 * 60 * 1000;

export const GCS_SIGNED_WRITE_EXPIRY_MS = 15 * 60 * 1000;

export const GCS_SIGNED_URL_VERSION = "v4" as const;

export const GCS_ACTION_READ = "read" as const;

export const GCS_ACTION_WRITE = "write" as const;

export const GCS_ACTION_RESUMABLE = "resumable" as const;
