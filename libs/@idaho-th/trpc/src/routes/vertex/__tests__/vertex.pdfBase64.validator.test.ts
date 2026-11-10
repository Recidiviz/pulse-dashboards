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
  MAX_BASE64_PDF_BYTES,
  PDF_FILE_SIGNATURE,
} from "~@idaho-th/trpc/routes/vertex/constants";

import {
  hasPdfSignature,
  normalizePdfBase64Input,
  validatePdfBase64Payload,
} from "../vertex.pdfBase64.validator";

const toBase64 = (buffer: Buffer) => buffer.toString("base64");

/** Smallest byte string that still passes every check. */
const validPdfBuffer = Buffer.from(`${PDF_FILE_SIGNATURE}1.7\n%%EOF\n`, "utf8");
const validPdfBase64 = toBase64(validPdfBuffer);

describe("hasPdfSignature", () => {
  it("accepts a buffer starting with the PDF file signature", () => {
    expect(hasPdfSignature(validPdfBuffer)).toBe(true);
  });

  it("rejects buffers that do not start with it", () => {
    expect(hasPdfSignature(Buffer.from("GIF89a", "utf8"))).toBe(false);
    // Signature present but not at offset 0.
    expect(hasPdfSignature(Buffer.from(`x${PDF_FILE_SIGNATURE}`, "utf8"))).toBe(
      false,
    );
  });

  it("rejects a buffer shorter than the signature", () => {
    expect(hasPdfSignature(Buffer.from("%P", "utf8"))).toBe(false);
    expect(hasPdfSignature(Buffer.alloc(0))).toBe(false);
  });
});

describe("normalizePdfBase64Input", () => {
  it("strips a data-URL prefix, case-insensitively", () => {
    expect(
      normalizePdfBase64Input(`data:application/pdf;base64,${"AAAA"}`),
    ).toBe("AAAA");
    expect(normalizePdfBase64Input("DATA:APPLICATION/PDF;BASE64,AAAA")).toBe(
      "AAAA",
    );
  });

  it("strips surrounding and embedded whitespace", () => {
    expect(normalizePdfBase64Input("  AA AA\n\tAA  ")).toBe("AAAAAA");
  });

  it("leaves a bare payload untouched", () => {
    expect(normalizePdfBase64Input(validPdfBase64)).toBe(validPdfBase64);
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(normalizePdfBase64Input("   \n ")).toBe("");
  });
});

describe("validatePdfBase64Payload", () => {
  it("accepts a well-formed base64 PDF", () => {
    expect(validatePdfBase64Payload(validPdfBase64)).toBeNull();
  });

  it("rejects an empty payload", () => {
    expect(validatePdfBase64Payload("")).toEqual({
      message: "PDF content must not be empty.",
    });
  });

  it("rejects a payload whose base64 header is not a PDF", () => {
    expect(validatePdfBase64Payload(toBase64(Buffer.from("GIF89a")))).toEqual({
      message: "Payload does not look like a base64-encoded PDF file.",
    });
  });

  it("rejects a truncated PDF that never reaches the full signature", () => {
    expect(validatePdfBase64Payload(toBase64(Buffer.from("%P")))).toEqual({
      message: "Payload does not look like a base64-encoded PDF file.",
    });
  });

  // The remaining two guards in validatePdfBase64Payload — "too small" and
  // "decoded file must be a PDF" — are unreachable through this entry point:
  // PDF_BASE64_HEADER_PREFIX is 7 base64 chars, which decode to exactly the
  // 5-byte "%PDF-" signature, so anything passing the prefix check already
  // satisfies both. They are defense in depth, kept deliberately.
  it("guarantees the prefix check implies a valid decoded signature", () => {
    const decodedPrefix = Buffer.from("JVBERi0", "base64");

    expect(decodedPrefix.toString("utf8")).toBe(PDF_FILE_SIGNATURE);
    expect(hasPdfSignature(decodedPrefix)).toBe(true);
  });

  it("rejects an oversized payload on character length before decoding", () => {
    const oversized = "JVBERi0".padEnd(MAX_BASE64_PDF_BYTES * 2, "A");

    expect(validatePdfBase64Payload(oversized)).toEqual({
      message: expect.stringContaining("maximum allowed decoded size"),
    });
  });

  it("rejects a payload whose decoded size exceeds the cap", () => {
    const oversized = Buffer.concat([
      validPdfBuffer,
      Buffer.alloc(MAX_BASE64_PDF_BYTES),
    ]);

    expect(validatePdfBase64Payload(toBase64(oversized))).toEqual({
      message: expect.stringContaining("maximum allowed decoded size"),
    });
  });
});
