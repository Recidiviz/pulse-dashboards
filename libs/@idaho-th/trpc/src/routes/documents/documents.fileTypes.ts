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

import type { FileTypeSpec } from "~@idaho-th/trpc/routes/documents/documents.types";

/**
 * Allowlisted document types with the magic-byte signatures used to verify the
 * real file matches its declared MIME type (§4). Validation never trusts the
 * client-declared extension or Content-Type alone.
 */

/** Bytes to read from the start of an object for magic-byte sniffing. */
export const MAGIC_BYTES_READ_LENGTH = 16;

function startsWith(bytes: Buffer, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }
  return signature.every((byte, index) => bytes[index] === byte);
}

// HEIC/HEIF: ISO-BMFF with an `ftyp` box at offset 4 and a HEIF-family brand.
const HEIF_BRANDS = new Set(["heic", "heif", "heix", "hevc", "mif1", "msf1"]);

function matchesHeif(bytes: Buffer): boolean {
  if (bytes.length < 12) {
    return false;
  }
  if (bytes.toString("ascii", 4, 8) !== "ftyp") {
    return false;
  }
  return HEIF_BRANDS.has(bytes.toString("ascii", 8, 12));
}

const FILE_TYPE_SPECS: readonly FileTypeSpec[] = [
  {
    mimeTypes: ["application/pdf"],
    extension: "pdf",
    matchesMagicBytes: (bytes) => startsWith(bytes, [0x25, 0x50, 0x44, 0x46]),
  },
  {
    mimeTypes: ["image/jpeg"],
    extension: "jpg",
    matchesMagicBytes: (bytes) => startsWith(bytes, [0xff, 0xd8, 0xff]),
  },
  {
    mimeTypes: ["image/png"],
    extension: "png",
    matchesMagicBytes: (bytes) =>
      startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    extension: "docx",
    // DOCX is a ZIP container, so this only confirms the ZIP local-file-header
    // signature shared by all OOXML/ZIP formats — it cannot distinguish a real
    // DOCX from an arbitrary ZIP. Acceptable here: objects are served as
    // attachment downloads from GCS and never parsed server-side. A full OOXML
    // check would require reading the ZIP central directory (end of file), not
    // just the head bytes this validator reads.
    matchesMagicBytes: (bytes) => startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]),
  },
  {
    mimeTypes: ["image/heic", "image/heif"],
    extension: "heic",
    matchesMagicBytes: matchesHeif,
  },
];

function findSpecByMimeType(mimeType: string): FileTypeSpec | undefined {
  return FILE_TYPE_SPECS.find((spec) => spec.mimeTypes.includes(mimeType));
}

export function isAllowedMimeType(mimeType: string): boolean {
  return findSpecByMimeType(mimeType) != null;
}

export function extensionForMimeType(mimeType: string): string | undefined {
  return findSpecByMimeType(mimeType)?.extension;
}

/**
 * Confirms the object's leading bytes match the declared MIME type. Returns
 * false for unknown types so callers reject anything off the allowlist.
 */
export function magicBytesMatchMimeType(
  bytes: Buffer,
  mimeType: string,
): boolean {
  const spec = findSpecByMimeType(mimeType);
  return spec != null && spec.matchesMagicBytes(bytes);
}
