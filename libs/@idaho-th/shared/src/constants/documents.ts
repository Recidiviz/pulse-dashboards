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

/**
 * Machine-readable upload error codes (§10.1). Surfaced as the TRPCError
 * message so the frontend can map them to user-facing copy.
 */
export const DOCUMENT_UPLOAD_ERROR = {
  UNSUPPORTED_FILE_TYPE: "UNSUPPORTED_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  TYPE_MISMATCH: "TYPE_MISMATCH",
  UPLOAD_NOT_FOUND: "UPLOAD_NOT_FOUND",
  DAILY_UPLOAD_QUOTA_EXCEEDED: "DAILY_UPLOAD_QUOTA_EXCEEDED",
} as const;

export type DocumentUploadErrorCode =
  (typeof DOCUMENT_UPLOAD_ERROR)[keyof typeof DOCUMENT_UPLOAD_ERROR];

/**
 * Max size for a vertex-intake PDF, shared by the client-side file check in
 * useVertexPdfExtraction and the server-side check in requestVertexUpload so
 * the two limits can't drift apart. Deliberately smaller than the Document
 * Tab's 50 MB MAX_DOCUMENT_BYTES: every vertex upload runs through the
 * mupdf ordering + Vertex extraction pipeline, so the limit bounds that
 * per-request processing cost, not just storage.
 */
export const MAX_VERTEX_UPLOAD_BYTES = 10 * 1024 * 1024;
