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

import { Opportunity } from "../../../../WorkflowsStore";
import {
  buildContactNoteRequestBody,
  chunkCommentToContactNote,
  contactNoteFirestoreDocId,
  generateContactNoteId,
} from "../utils";

describe("chunkCommentToContactNote", () => {
  it("returns a single page with a single line for short comments", () => {
    const result = chunkCommentToContactNote("Short comment");
    expect(result).toEqual({ 1: ["Short comment"] });
  });

  it("wraps long lines at word boundaries", () => {
    const longLine = "word ".repeat(20).trim(); // 99 chars
    const result = chunkCommentToContactNote(longLine);

    const allLines = Object.values(result).flat();
    for (const line of allLines) {
      expect(line.length).toBeLessThanOrEqual(70);
    }
  });

  it("uses 1-based page keys", () => {
    const result = chunkCommentToContactNote("Hello");
    expect(Object.keys(result)).toEqual(["1"]);
  });

  it("paginates into multiple pages for long comments", () => {
    // 11 lines of 70 chars should produce 2 pages
    const longComment = Array(11).fill("x".repeat(65)).join(" ");
    const result = chunkCommentToContactNote(longComment);

    expect(Object.keys(result).length).toBeGreaterThanOrEqual(2);
    expect(result[1].length).toBeLessThanOrEqual(10);
  });

  it("handles 1600 char comments correctly", () => {
    const maxComment = "word ".repeat(320).trim(); // ~1600 chars
    const result = chunkCommentToContactNote(maxComment);

    const totalLines = Object.values(result).flat().length;
    // ~1600 chars / 70 chars per line = ~23 lines = 3 pages
    expect(Object.keys(result).length).toBeLessThanOrEqual(4);
    expect(totalLines).toBeGreaterThan(10);

    for (const page of Object.values(result)) {
      expect(page.length).toBeLessThanOrEqual(10);
    }
  });
});

describe("contactNoteFirestoreDocId", () => {
  it("returns the opportunity update document ID", () => {
    const mockOpp = {
      firestoreUpdateDocId: "usTnCompliantReporting2025Policy",
    } as unknown as Opportunity;

    expect(contactNoteFirestoreDocId(mockOpp)).toBe(
      "usTnCompliantReporting2025Policy",
    );
  });
});

describe("generateContactNoteId", () => {
  it("returns a Firestore-safe ID", () => {
    expect(generateContactNoteId()).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("buildContactNoteRequestBody", () => {
  it("returns the correct shape with contactTypeCodes as a list", () => {
    const mockOpp = {
      person: { externalId: "00431278" },
    } as unknown as Opportunity;

    const result = buildContactNoteRequestBody(
      mockOpp,
      "STAFF123",
      ["DECF"],
      "Test comment",
      "contact-note-id",
    );

    expect(result).toMatchObject({
      stateCode: "US_TN",
      personExternalId: "00431278",
      personExternalIdType: "US_TN_DOC",
      staffId: "STAFF123",
      staffIdType: "US_TN_STAFF_TOMIS",
      contactNoteId: "contact-note-id",
      contactTypeCodes: ["DECF"],
    });
    expect(result.contactNote).toBeDefined();
    expect(result.contactNoteDateTime).toBeDefined();
  });

  it("accepts multiple contact type codes", () => {
    const mockOpp = {
      person: { externalId: "00431278" },
    } as unknown as Opportunity;

    const result = buildContactNoteRequestBody(
      mockOpp,
      "STAFF123",
      ["DECF", "DEIO", "DEDU"],
      "Multiple denial codes",
      "contact-note-id",
    );

    expect(result.contactTypeCodes).toEqual(["DECF", "DEIO", "DEDU"]);
  });

  it("does not include shouldQueueTask or votersRightsCode", () => {
    const mockOpp = {
      person: { externalId: "00431278" },
    } as unknown as Opportunity;

    const result = buildContactNoteRequestBody(
      mockOpp,
      "STAFF123",
      ["REIO"],
      "comment",
      "contact-note-id",
    );

    expect(result).not.toHaveProperty("shouldQueueTask");
    expect(result).not.toHaveProperty("votersRightsCode");
    expect(result).not.toHaveProperty("contactTypeCode");
  });
});
