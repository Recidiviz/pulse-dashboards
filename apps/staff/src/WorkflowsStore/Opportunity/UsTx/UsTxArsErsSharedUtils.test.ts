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

import { UsTxAnnualReportStatusV2Form } from "../Forms/UsTxAnnualReportStatusV2Form/UsTxAnnualReportStatusV2Form";
import type { Opportunity } from "../types";
import { getDynamicCaseNoteHeaders } from "./UsTxArsErsSharedUtils";

// Minimal fake form shape — userHasFilledNecessaryFields only reads these properties.
function makeForm({
  updateById,
  currentUserId,
  draftData,
  formData,
  fieldAuthors = {},
}: {
  updateById?: string;
  currentUserId?: string;
  draftData?: Record<string, any>;
  formData?: Record<string, any>;
  fieldAuthors?: Record<string, string>;
}): any {
  return {
    formLastUpdated: updateById !== undefined ? { updateById } : undefined,
    currentUserId,
    draftData: draftData ?? {},
    formData: formData ?? {},
    fieldAuthors,
    userHasFilledNecessaryFields:
      UsTxAnnualReportStatusV2Form.prototype.userHasFilledNecessaryFields,
  };
}

// A fully-filled paroleOfficer block.
const paroleOfficerDraft = {
  officerName: "Officer Jane",
  supervisingOfficerSignature: "sig",
  supervisingOfficerDate: "2026-01-01",
  supervisingOfficerRecommendCheckYes: true,
};

const paroleOfficerFieldAuthors = {
  officerName: "user1",
  supervisingOfficerSignature: "user1",
  supervisingOfficerDate: "user1",
  supervisingOfficerRecommendCheckYes: "user1",
};

const unitSupervisorDraft = {
  unitSupervisorSignature: "sig",
  unitSupervisorName: "Supervisor Bob",
  unitSupervisorDate: "2026-01-02",
  unitSupervisorConcurWithSupervisingOfficerCheckYes: true,
};

const unitSupervisorFieldAuthors = {
  unitSupervisorSignature: "user1",
  unitSupervisorName: "user1",
  unitSupervisorDate: "user1",
  unitSupervisorConcurWithSupervisingOfficerCheckYes: "user1",
};

describe("form.userHasFilledNecessaryFields", () => {
  describe("returns false", () => {
    it("when fieldAuthors is empty (current user has not authored any blocking field)", () => {
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: paroleOfficerDraft,
        formData: paroleOfficerDraft,
        fieldAuthors: {},
      });
      expect(form.userHasFilledNecessaryFields()).toBe(false);
    });

    it("when formLastUpdated is undefined (never saved)", () => {
      const form = makeForm({
        updateById: undefined,
        currentUserId: "user1",
        draftData: paroleOfficerDraft,
        formData: paroleOfficerDraft,
        fieldAuthors: paroleOfficerFieldAuthors,
      });
      expect(form.userHasFilledNecessaryFields()).toBe(false);
    });

    it("when the last editor is a different user", () => {
      const form = makeForm({
        updateById: "other-user",
        currentUserId: "user1",
        draftData: paroleOfficerDraft,
        formData: paroleOfficerDraft,
        fieldAuthors: paroleOfficerFieldAuthors,
      });
      expect(form.userHasFilledNecessaryFields()).toBe(false);
    });

    it("when a started block is missing a required string field in formData", () => {
      const incompleteFormData = {
        // officerName is missing
        supervisingOfficerSignature: "sig",
        supervisingOfficerDate: "2026-01-01",
        supervisingOfficerRecommendCheckYes: true,
      };
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: paroleOfficerDraft,
        formData: incompleteFormData,
        fieldAuthors: paroleOfficerFieldAuthors,
      });
      expect(form.userHasFilledNecessaryFields()).toBe(false);
    });

    it("when a started block has neither checkbox option filled in formData", () => {
      const formDataMissingCheckbox = {
        officerName: "Officer Jane",
        supervisingOfficerSignature: "sig",
        supervisingOfficerDate: "2026-01-01",
        // neither supervisingOfficerRecommendCheckYes nor supervisingOfficerRecommendCheckNo
      };
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: paroleOfficerDraft,
        formData: formDataMissingCheckbox,
        fieldAuthors: paroleOfficerFieldAuthors,
      });
      expect(form.userHasFilledNecessaryFields()).toBe(false);
    });

    it("when multiple blocks are started but one is incomplete", () => {
      const incompleteUnitSupervisor = {
        unitSupervisorSignature: "sig",
        // unitSupervisorName and unitSupervisorDate missing
      };
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: { ...paroleOfficerDraft, ...unitSupervisorDraft },
        formData: { ...paroleOfficerDraft, ...incompleteUnitSupervisor },
        fieldAuthors: {
          ...paroleOfficerFieldAuthors,
          ...unitSupervisorFieldAuthors,
        },
      });
      expect(form.userHasFilledNecessaryFields()).toBe(false);
    });

    it("when a block has some real values and one blocking field written as an empty string", () => {
      // supervisingOfficerDate was cleared back to "" — the block has a real
      // authored value elsewhere (officerName) so it does count as started,
      // and the blank date should keep it incomplete.
      const draftData = { ...paroleOfficerDraft, supervisingOfficerDate: "" };
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData,
        formData: draftData,
        fieldAuthors: paroleOfficerFieldAuthors,
      });
      expect(form.userHasFilledNecessaryFields()).toBe(false);
    });

    it("when the current user only filled non-blocking fields and a previous user filled the blocking fields", () => {
      const previousUserBlockingFields = Object.fromEntries(
        Object.keys(paroleOfficerDraft).map((k) => [k, "user-prev"]),
      );
      const form = makeForm({
        updateById: "user2",
        currentUserId: "user2",
        // draftData is the accumulated map: user-prev's blocking fields + user2's remarks
        draftData: {
          ...paroleOfficerDraft,
          regionDirectorRemarks: "looks good",
        },
        formData: {
          ...paroleOfficerDraft,
          regionDirectorRemarks: "looks good",
        },
        fieldAuthors: {
          ...previousUserBlockingFields,
          regionDirectorRemarks: "user2",
        },
      });
      expect(form.userHasFilledNecessaryFields()).toBe(false);
    });
  });

  describe("returns true", () => {
    it("when one block is started and complete and the current user was the last editor", () => {
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: paroleOfficerDraft,
        formData: paroleOfficerDraft,
        fieldAuthors: paroleOfficerFieldAuthors,
      });
      expect(form.userHasFilledNecessaryFields()).toBe(true);
    });

    it("when the block is started by the alternate checkbox option in fieldAuthors", () => {
      const draftWithAlternateCheckbox = {
        officerName: "Officer Jane",
        supervisingOfficerSignature: "sig",
        supervisingOfficerDate: "2026-01-01",
        supervisingOfficerRecommendCheckNo: true,
      };
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: draftWithAlternateCheckbox,
        formData: draftWithAlternateCheckbox,
        fieldAuthors: {
          officerName: "user1",
          supervisingOfficerSignature: "user1",
          supervisingOfficerDate: "2026-01-01",
          supervisingOfficerRecommendCheckNo: "user1",
        },
      });
      expect(form.userHasFilledNecessaryFields()).toBe(false);
    });

    it("when the block's checkbox field is not satisfied by formData having the alternate option", () => {
      // fieldAuthors has CheckYes, formData has CheckNo. CheckNo does not satisfy the requirement.
      const draftData = {
        officerName: "Officer Jane",
        supervisingOfficerSignature: "sig",
        supervisingOfficerDate: "2026-01-01",
        supervisingOfficerRecommendCheckYes: true,
      };
      const formData = {
        officerName: "Officer Jane",
        supervisingOfficerSignature: "sig",
        supervisingOfficerDate: "2026-01-01",
        supervisingOfficerRecommendCheckNo: true,
      };
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData,
        formData,
        fieldAuthors: paroleOfficerFieldAuthors,
      });
      expect(form.userHasFilledNecessaryFields()).toBe(false);
    });

    it("when multiple blocks are started and all are complete", () => {
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: { ...paroleOfficerDraft, ...unitSupervisorDraft },
        formData: { ...paroleOfficerDraft, ...unitSupervisorDraft },
        fieldAuthors: {
          ...paroleOfficerFieldAuthors,
          ...unitSupervisorFieldAuthors,
        },
      });
      expect(form.userHasFilledNecessaryFields()).toBe(true);
    });

    it("when one block is genuinely complete and a second block's only touched field is an empty string", () => {
      // unitSupervisorSignature was touched and left blank (e.g. clicked into and
      // out of without typing) — that block should be treated as if it was never
      // started, so it doesn't block submission on the strength of the complete
      // paroleOfficer block.
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: { ...paroleOfficerDraft, unitSupervisorSignature: "" },
        formData: { ...paroleOfficerDraft, unitSupervisorSignature: "" },
        fieldAuthors: {
          ...paroleOfficerFieldAuthors,
          unitSupervisorSignature: "user1",
        },
      });
      expect(form.userHasFilledNecessaryFields()).toBe(true);
    });

    it("when only a subset of blocks have draftData and those are all complete", () => {
      // unitSupervisor block has no draftData, so it is not "started" and not required.
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: paroleOfficerDraft,
        formData: { ...paroleOfficerDraft, ...unitSupervisorDraft },
        fieldAuthors: paroleOfficerFieldAuthors,
      });
      expect(form.userHasFilledNecessaryFields()).toBe(true);
    });
  });

  // allStartedBlocksComplete is vacuously true for a block whenever none of its
  // fields are truthy in draftData — undefined and "" are both falsy, so it treats
  // them identically. Each case below pairs an untouched-in-various-ways
  // unitSupervisor block with a genuinely complete, authored paroleOfficer block:
  // if allStartedBlocksComplete incorrectly treated the unitSupervisor block as
  // "started but incomplete" in any of these cases, the overall result would flip
  // to false.
  describe("allStartedBlocksComplete", () => {
    it("returns true when a block's fields are all undefined (never written to draftData)", () => {
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: paroleOfficerDraft,
        formData: paroleOfficerDraft,
        fieldAuthors: paroleOfficerFieldAuthors,
      });
      expect(form.userHasFilledNecessaryFields()).toBe(true);
    });

    it("returns true when a block's fields are all written as empty strings", () => {
      const blankUnitSupervisor = {
        unitSupervisorSignature: "",
        unitSupervisorName: "",
        unitSupervisorDate: "",
        unitSupervisorConcurWithSupervisingOfficerCheckYes: "",
      };
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: { ...paroleOfficerDraft, ...blankUnitSupervisor },
        formData: { ...paroleOfficerDraft, ...blankUnitSupervisor },
        fieldAuthors: {
          ...paroleOfficerFieldAuthors,
          unitSupervisorSignature: "user1",
          unitSupervisorName: "user1",
          unitSupervisorDate: "user1",
          unitSupervisorConcurWithSupervisingOfficerCheckYes: "user1",
        },
      });
      expect(form.userHasFilledNecessaryFields()).toBe(true);
    });

    it("returns true when a block's fields are a mix of undefined and empty strings", () => {
      const partiallyBlankUnitSupervisor = {
        // unitSupervisorSignature and unitSupervisorDate are undefined (omitted)
        unitSupervisorName: "",
        unitSupervisorConcurWithSupervisingOfficerCheckYes: "",
      };
      const form = makeForm({
        updateById: "user1",
        currentUserId: "user1",
        draftData: { ...paroleOfficerDraft, ...partiallyBlankUnitSupervisor },
        formData: { ...paroleOfficerDraft, ...partiallyBlankUnitSupervisor },
        fieldAuthors: {
          ...paroleOfficerFieldAuthors,
          unitSupervisorName: "user1",
          unitSupervisorConcurWithSupervisingOfficerCheckYes: "user1",
        },
      });
      expect(form.userHasFilledNecessaryFields()).toBe(true);
    });
  });
});

describe("getDynamicCaseNoteHeaders", () => {
  const mockOpp = (caseNoteTitles: string[]): Opportunity => {
    return {
      record: {
        caseNotes: Object.fromEntries(caseNoteTitles.map((t) => [t, []])),
      },
    } as unknown as Opportunity;
  };

  it("returns both headers if either present", () => {
    expect(
      getDynamicCaseNoteHeaders(mockOpp(["Most Recent Payments"])),
    ).toEqual(["Current Fees", "Most Recent Payments"]);
    expect(getDynamicCaseNoteHeaders(mockOpp(["Current Fees"]))).toEqual([
      "Current Fees",
      "Most Recent Payments",
    ]);
    expect(
      getDynamicCaseNoteHeaders(
        mockOpp(["Current Fees", "Most Recent Payments"]),
      ),
    ).toEqual(["Current Fees", "Most Recent Payments"]);
    expect(
      getDynamicCaseNoteHeaders(
        mockOpp(["Current Fees", "Most Recent Payments", "And Others"]),
      ),
    ).toEqual(["Current Fees", "Most Recent Payments"]);
  });

  it("returns [] if headers not present", () => {
    expect(
      getDynamicCaseNoteHeaders(
        mockOpp(["Some header", "Other title about Most Recent Payments"]),
      ),
    ).toEqual([]);
  });

  it("returns [] if caseNotes is {} or undefined", () => {
    expect(
      getDynamicCaseNoteHeaders({
        record: {
          caseNotes: {},
        },
      } as unknown as Opportunity),
    ).toEqual([]);

    expect(
      getDynamicCaseNoteHeaders({
        record: {},
      } as unknown as Opportunity),
    ).toEqual([]);
  });
});
