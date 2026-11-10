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

import {
  MAX_BASE64_PDF_BYTES,
  PDF_BASE64_HEADER_PREFIX,
  PDF_FILE_SIGNATURE,
} from "~@idaho-th/trpc/routes/vertex/constants";

const MAX_PDF_MB = MAX_BASE64_PDF_BYTES / (1024 * 1024);

const PDF_SIZE_EXCEEDED_MESSAGE = `PDF exceeds the maximum allowed decoded size of ${String(MAX_PDF_MB)} MB.`;

/** Upper bound on base64 character length that could decode to <= MAX bytes (plus padding slack). */
const maxBase64CharsForDecodedSize =
  Math.ceil((MAX_BASE64_PDF_BYTES * 4) / 3) + 4;

const PDF_HEADER_BUFFER = Buffer.from(PDF_FILE_SIGNATURE, "utf8");

/** True if `buffer` starts with the `%PDF-` file signature. */
export function hasPdfSignature(buffer: Buffer): boolean {
  return (
    buffer.length >= PDF_HEADER_BUFFER.length &&
    buffer.subarray(0, PDF_HEADER_BUFFER.length).equals(PDF_HEADER_BUFFER)
  );
}

export function normalizePdfBase64Input(raw: string): string {
  const trimmed = raw.trim();
  const dataUrl = /^data:application\/pdf;base64,(.*)$/is.exec(trimmed);
  const payload = dataUrl ? dataUrl[1] : trimmed;
  return payload.replace(/\s/g, "");
}

export type PdfBase64ValidationFailure = {
  message: string;
};

export function validatePdfBase64Payload(
  payload: string,
): PdfBase64ValidationFailure | null {
  if (!payload) {
    return { message: "PDF content must not be empty." };
  }

  if (payload.length > maxBase64CharsForDecodedSize) {
    return { message: PDF_SIZE_EXCEEDED_MESSAGE };
  }

  if (!payload.startsWith(PDF_BASE64_HEADER_PREFIX)) {
    return {
      message: "Payload does not look like a base64-encoded PDF file.",
    };
  }

  const decoded = Buffer.from(payload, "base64");

  if (decoded.length > MAX_BASE64_PDF_BYTES) {
    return { message: PDF_SIZE_EXCEEDED_MESSAGE };
  }

  if (decoded.length < PDF_HEADER_BUFFER.length) {
    return { message: "Decoded PDF is too small to be a valid PDF file." };
  }

  if (!hasPdfSignature(decoded)) {
    return {
      message: `Decoded file must be a PDF (expected header ${PDF_FILE_SIGNATURE}).`,
    };
  }

  return null;
}
