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

import { getTrusteeCriterionNumber, TRUSTEE_CRITERIA } from "~datatypes";

import { criterionFailureNote, ROW_NOTE_COPY } from "../TrusteeCriteriaSection";

const byNumber = (n: number) => TRUSTEE_CRITERIA[n - 1];

describe("criterionFailureNote", () => {
  it("shows nothing until a criterion is marked False", () => {
    expect(criterionFailureNote(byNumber(1), undefined)).toBeUndefined();
    expect(criterionFailureNote(byNumber(1), "")).toBeUndefined();
    expect(criterionFailureNote(byNumber(1), "true")).toBeUndefined();
  });

  it.each([1, 2, 4, 5, 6])(
    "reports both requirements for criterion %i",
    (n) => {
      expect(criterionFailureNote(byNumber(n), "false")).toBe(
        `${ROW_NOTE_COPY.trusteeNotMet} ${ROW_NOTE_COPY.annexNotMet}`,
      );
    },
  );

  it.each([7, 8, 9, 10, 11, 12, 13])(
    "reports only the Trustee requirement for criterion %i",
    (n) => {
      expect(criterionFailureNote(byNumber(n), "false")).toBe(
        ROW_NOTE_COPY.trusteeNotMet,
      );
    },
  );

  it.each([14, 15])(
    "names the added approver rather than a failure for criterion %i",
    (n) => {
      const note = criterionFailureNote(byNumber(n), "false");

      expect(note).toBe(ROW_NOTE_COPY.acApproval);
      expect(note).not.toContain(ROW_NOTE_COPY.trusteeNotMet);
    },
  );

  describe("criterion 3, the sex offender criterion", () => {
    const criterion3 = byNumber(3);

    it("withholds the Annex half until the sub-question is answered", () => {
      const note = criterionFailureNote(criterion3, "false");

      expect(note).toBe(ROW_NOTE_COPY.trusteeNotMet);
      expect(note).not.toContain(ROW_NOTE_COPY.annexNotMet);
    });

    it("keeps Annex open when the sub-question is True", () => {
      expect(criterionFailureNote(criterion3, "false", "true")).toBe(
        `${ROW_NOTE_COPY.trusteeNotMet} ${ROW_NOTE_COPY.annexSexOffenderEligible}`,
      );
    });

    it("closes Annex when the sub-question is False", () => {
      expect(criterionFailureNote(criterion3, "false", "false")).toBe(
        `${ROW_NOTE_COPY.trusteeNotMet} ${ROW_NOTE_COPY.annexNotMet}`,
      );
    });

    it("ignores the sub-question when the criterion is True", () => {
      expect(criterionFailureNote(criterion3, "true", "false")).toBeUndefined();
    });
  });

  it("never renders the criterion text as the reason for failure", () => {
    TRUSTEE_CRITERIA.forEach((criterion) => {
      const note = criterionFailureNote(criterion, "false");
      expect(note).toBeDefined();
      expect(note).not.toContain(criterion.text.split("**")[0].trim());
    });
  });

  it("derives the note from the criterion flags, not its position", () => {
    const deferring = TRUSTEE_CRITERIA.filter(
      (c) =>
        criterionFailureNote(c, "false") === ROW_NOTE_COPY.trusteeNotMet &&
        c.affectsAnnex,
    );

    expect(deferring.map((c) => getTrusteeCriterionNumber(c.key))).toEqual([3]);
  });
});
