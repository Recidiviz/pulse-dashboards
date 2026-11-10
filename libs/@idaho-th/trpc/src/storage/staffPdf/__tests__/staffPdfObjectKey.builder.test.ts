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
  buildStaffUploadObjectKey,
} from "../staffPdfObjectKey.builder";

const STAFF_PSEUDONYMIZED_ID = "staff-1";
const OBJECT_ID = "11111111-1111-4111-8111-111111111111";
const STAFF_PREFIX = `applications/staff/${STAFF_PSEUDONYMIZED_ID}/`;

describe("buildStaffUploadObjectKey", () => {
  it("defaults to the handwritten-source document type", () => {
    expect(buildStaffUploadObjectKey(STAFF_PSEUDONYMIZED_ID, OBJECT_ID)).toBe(
      `${STAFF_PREFIX}HANDWRITTEN_SOURCE/${OBJECT_ID}_handwritten-application.pdf`,
    );
  });

  it.each([
    [HousingApplicationDocumentType.DIGITIZED, "digitized-application"],
    [HousingApplicationDocumentType.ATTACHMENT, "attachment"],
  ])("builds a %s key under the staff prefix", (documentType, suffix) => {
    expect(
      buildStaffUploadObjectKey(
        STAFF_PSEUDONYMIZED_ID,
        OBJECT_ID,
        documentType,
      ),
    ).toBe(`${STAFF_PREFIX}${documentType}/${OBJECT_ID}_${suffix}.pdf`);
  });

  it("re-exports the shared file name builder", () => {
    expect(
      buildApplicationDocumentFileName(
        OBJECT_ID,
        HousingApplicationDocumentType.DIGITIZED,
      ),
    ).toBe(`${OBJECT_ID}_digitized-application.pdf`);
  });
});

// Object keys are what keep one application's files out of another's prefix, so
// a hostile id must either fail key validation or stay inside the staff prefix.
const TRAVERSAL_IDS: [label: string, id: string][] = [
  ["parent traversal", "../../other-staff/file"],
  ["leading slash", "/etc/passwd"],
  ["empty segment", `a//${OBJECT_ID}`],
  ["null byte", `${OBJECT_ID}\u0000`],
  ["unicode", `${OBJECT_ID}-café`],
];

const IN_FILE_NAME_IDS: [label: string, id: string][] = [
  ["bare parent segment", ".."],
  ["current-directory segment", "."],
  ["trailing slash", `${OBJECT_ID}/`],
  ["empty string", ""],
];

describe("buildStaffUploadObjectKey rejects keys that could escape the prefix", () => {
  it.each(TRAVERSAL_IDS)(
    "rejects an objectId with a %s",
    (_label, objectId) => {
      expect(() =>
        buildStaffUploadObjectKey(STAFF_PSEUDONYMIZED_ID, objectId),
      ).toThrow("Generated GCS object key failed validation");
    },
  );

  it.each([...TRAVERSAL_IDS, ...IN_FILE_NAME_IDS])(
    "rejects a staffPseudonymizedId with a %s",
    (_label, staffPseudonymizedId) => {
      // The staff id is its own path segment, so every one of these breaks the key.
      expect(() =>
        buildStaffUploadObjectKey(staffPseudonymizedId, OBJECT_ID),
      ).toThrow("Generated GCS object key failed validation");
    },
  );

  it.each(IN_FILE_NAME_IDS)(
    "keeps an accepted objectId with a %s inside the staff prefix",
    (_label, objectId) => {
      // These land inside the file name rather than as their own segment, so the
      // key is valid — what matters is that it cannot leave the prefix.
      const key = buildStaffUploadObjectKey(STAFF_PSEUDONYMIZED_ID, objectId);

      expect(key.startsWith(STAFF_PREFIX)).toBe(true);
      expect(key.split("/")).not.toContain("..");
    },
  );

  it("keeps a 500-character object id inside the staff prefix", () => {
    const longObjectId = "a".repeat(500);
    const key = buildStaffUploadObjectKey(STAFF_PSEUDONYMIZED_ID, longObjectId);

    expect(key.startsWith(STAFF_PREFIX)).toBe(true);
    expect(key).toContain(longObjectId);
  });
});
