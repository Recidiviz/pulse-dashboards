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

import { HousingApplicationDocumentType } from "~@idaho-th/prisma/client";
import {
  buildApplicationDocumentFileName,
  buildApplicationDocumentObjectKey,
  buildStaffApplicationDocumentObjectKey,
  sanitizeDisplayFileName,
} from "~@idaho-th/trpc/storage/applicationDocument/applicationDocumentObjectKey.builder";

const OBJECT_ID = "11111111-1111-4111-8111-111111111111";

describe("applicationDocumentObjectKey.builder", () => {
  it("builds file names keyed on an opaque object id (no client PII)", () => {
    expect(
      buildApplicationDocumentFileName(
        OBJECT_ID,
        HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      ),
    ).toBe(`${OBJECT_ID}_handwritten-application.pdf`);
    expect(
      buildApplicationDocumentFileName(
        OBJECT_ID,
        HousingApplicationDocumentType.DIGITIZED,
      ),
    ).toBe(`${OBJECT_ID}_digitized-application.pdf`);
  });

  it("builds staff-scoped object keys keyed on an opaque object id", () => {
    expect(
      buildStaffApplicationDocumentObjectKey({
        staffPseudonymizedId: "staff-1",
        objectId: OBJECT_ID,
        documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      }),
    ).toBe(
      `applications/staff/staff-1/HANDWRITTEN_SOURCE/${OBJECT_ID}_handwritten-application.pdf`,
    );
  });
});

describe("buildApplicationDocumentObjectKey", () => {
  const applicationId = "22222222-2222-4222-8222-222222222222";

  it("nests the document under its application", () => {
    expect(
      buildApplicationDocumentObjectKey({
        applicationId,
        documentId: OBJECT_ID,
      }),
    ).toBe(`applications/${applicationId}/documents/${OBJECT_ID}`);
  });

  it("appends an extension only when one is supplied", () => {
    expect(
      buildApplicationDocumentObjectKey({
        applicationId,
        documentId: OBJECT_ID,
        extension: "pdf",
      }),
    ).toBe(`applications/${applicationId}/documents/${OBJECT_ID}.pdf`);
    expect(
      buildApplicationDocumentObjectKey({
        applicationId,
        documentId: OBJECT_ID,
        extension: "",
      }),
    ).not.toContain(".");
  });

  it.each([
    ["a traversal application id", { applicationId: "../other" }],
    ["a traversal document id", { documentId: "../../etc/passwd" }],
    ["an empty application id", { applicationId: "" }],
    ["a unicode document id", { documentId: "café" }],
    ["a null byte", { documentId: "doc\u0000" }],
  ])("rejects %s rather than escaping the prefix", (_label, overrides) => {
    expect(() =>
      buildApplicationDocumentObjectKey({
        applicationId,
        documentId: OBJECT_ID,
        ...overrides,
      }),
    ).toThrow("Generated GCS object key failed validation");
  });

  it("rejects a staff key whose extension breaks validation", () => {
    expect(() =>
      buildStaffApplicationDocumentObjectKey({
        staffPseudonymizedId: "staff-1",
        objectId: OBJECT_ID,
        documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
        extension: "p df",
      }),
    ).toThrow("Generated GCS object key failed validation");
  });

  it("honours a custom extension on the file name", () => {
    expect(
      buildApplicationDocumentFileName(
        OBJECT_ID,
        HousingApplicationDocumentType.ATTACHMENT,
        "png",
      ),
    ).toBe(`${OBJECT_ID}_attachment.png`);
  });
});

describe("sanitizeDisplayFileName", () => {
  it.each([
    ["a plain name", "scan.pdf", "scan.pdf"],
    ["path separators", "a/b\\c.pdf", "a b c.pdf"],
    ["collapsed whitespace", "  my   scan .pdf  ", "my scan .pdf"],
    ["control characters", "sc\u0001a\u007fn.pdf", "scan.pdf"],
    ["an empty name", "", "document"],
    ["only separators", "///", "document"],
    ["only control characters", "\u0001\u0002", "document"],
  ])("normalizes %s", (_label, fileName, expected) => {
    expect(sanitizeDisplayFileName(fileName)).toBe(expected);
  });

  it("caps the length at 200 characters", () => {
    expect(sanitizeDisplayFileName("a".repeat(500))).toHaveLength(200);
  });

  it("keeps unicode that is merely non-ASCII", () => {
    expect(sanitizeDisplayFileName("café.pdf")).toBe("café.pdf");
  });
});
