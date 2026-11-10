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

import { describe, expect, it } from "vitest";

import {
  extensionForMimeType,
  isAllowedMimeType,
  magicBytesMatchMimeType,
} from "../documents.fileTypes";

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

describe("isAllowedMimeType", () => {
  it("accepts the allowlisted types", () => {
    for (const mime of [
      PDF_MIME,
      "image/jpeg",
      "image/png",
      DOCX_MIME,
      "image/heic",
      "image/heif",
    ]) {
      expect(isAllowedMimeType(mime)).toBe(true);
    }
  });

  it("rejects types off the allowlist", () => {
    expect(isAllowedMimeType("application/zip")).toBe(false);
    expect(isAllowedMimeType("text/html")).toBe(false);
  });
});

describe("extensionForMimeType", () => {
  it("maps MIME types to extensions", () => {
    expect(extensionForMimeType(PDF_MIME)).toBe("pdf");
    expect(extensionForMimeType("image/jpeg")).toBe("jpg");
    expect(extensionForMimeType(DOCX_MIME)).toBe("docx");
    expect(extensionForMimeType("image/heic")).toBe("heic");
  });

  it("returns undefined for unknown types", () => {
    expect(extensionForMimeType("application/zip")).toBeUndefined();
  });
});

describe("magicBytesMatchMimeType", () => {
  it("matches a real PDF header", () => {
    const pdf = Buffer.from("%PDF-1.7\n", "ascii");
    expect(magicBytesMatchMimeType(pdf, PDF_MIME)).toBe(true);
  });

  it("rejects a PNG masquerading as a PDF", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(magicBytesMatchMimeType(png, PDF_MIME)).toBe(false);
    expect(magicBytesMatchMimeType(png, "image/png")).toBe(true);
  });

  it("matches a DOCX (ZIP) container header", () => {
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    expect(magicBytesMatchMimeType(zip, DOCX_MIME)).toBe(true);
  });

  it("matches a HEIC ftyp box with a HEIF-family brand", () => {
    const heic = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x18]),
      Buffer.from("ftypheic", "ascii"),
    ]);
    expect(magicBytesMatchMimeType(heic, "image/heic")).toBe(true);
  });

  it("rejects an unknown MIME type regardless of bytes", () => {
    const pdf = Buffer.from("%PDF-1.7\n", "ascii");
    expect(magicBytesMatchMimeType(pdf, "application/zip")).toBe(false);
  });
});
