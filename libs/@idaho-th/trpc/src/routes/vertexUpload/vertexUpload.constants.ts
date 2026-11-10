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

/** Hard cap on how long the mupdf ordering/orientation worker call may run. */
export const VERTEX_UPLOAD_ORDERING_TIMEOUT_MS = 30_000;

// Single source of truth lives in ~@idaho-th/shared so the client-side file
// check (useVertexPdfExtraction) and the server-side check (requestVertexUpload)
// enforce the same limit. Re-exported here so server-side callers keep
// importing it alongside the other vertex-upload constants.
export { MAX_VERTEX_UPLOAD_BYTES } from "~@idaho-th/shared";
