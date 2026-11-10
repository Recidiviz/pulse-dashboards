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

export {
  DOCUMENT_UPLOAD_ERROR,
  type DocumentUploadErrorCode,
} from "~@idaho-th/shared";

/** Maximum upload size for a document (§4.2). */
export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

/**
 * Max confirmed documents a single uploader (staff or provider) may complete
 * per UTC calendar day. PENDING / REJECTED rows do not count — only uploads
 * that reach CONFIRMED after GCS verification. Sized from expected usage:
 * ~150 CMs, each uploading for 3-10 cases/month; at the 10-case upper bound
 * that's 1500 documents/month across all CMs, or ~75/day for one CM over 20
 * working days.
 */
export const DAILY_UPLOAD_QUOTA_PER_UPLOADER = 75;

/** Start of the current UTC calendar day (quota resets at midnight UTC). */
export function startOfUtcCalendarDay(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** Short-lived TTL for download URLs (§7.4). */
export const DOCUMENT_DOWNLOAD_URL_TTL_MS = 5 * 60 * 1000;
