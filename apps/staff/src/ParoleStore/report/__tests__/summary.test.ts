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

import { SummaryInput } from "~datatypes";

import { resolveSummary } from "../summary";

const EDITED_AT = new Date("2026-11-11T15:00:00Z");

const phiEdit = <T>(value: T | null) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: EDITED_AT,
});

const NOT_ENTERED = {
  value: null,
  source: "ATLAS",
  atlasValue: null,
  editedBy: null,
  editedAt: null,
};

// The schema's own type, so a schema change that no longer fits the Summary
// config fails the type check here.
const input = (fields: NonNullable<SummaryInput["fields"]>): SummaryInput => ({
  fields,
});

describe("resolveSummary", () => {
  it("shows both fields empty before the PHI enters anything", () => {
    expect(resolveSummary(undefined)).toEqual({
      fields: { summary: NOT_ENTERED, fourthAmendmentWaiver: NOT_ENTERED },
      rows: [],
    });
    expect(resolveSummary({})).toEqual(resolveSummary(undefined));
  });

  it("shows the PHI's summary and waiver answer, with who entered them", () => {
    const { fields } = resolveSummary(
      input({
        summary: phiEdit("Cooperative throughout the interview."),
        fourthAmendmentWaiver: phiEdit("YES"),
      }),
    );

    expect(fields.summary).toEqual({
      value: "Cooperative throughout the interview.",
      source: "PHI",
      atlasValue: null,
      editedBy: "phi@us_id.gov",
      editedAt: EDITED_AT,
    });
    expect(fields.fourthAmendmentWaiver.value).toBe("YES");
  });

  it("shows a field the PHI entered while the other stays empty", () => {
    const { fields } = resolveSummary(
      input({ fourthAmendmentWaiver: phiEdit("INTERVIEW_NOT_CONDUCTED") }),
    );

    expect(fields.fourthAmendmentWaiver.value).toBe("INTERVIEW_NOT_CONDUCTED");
    expect(fields.summary).toEqual(NOT_ENTERED);
  });

  it("shows a summary the PHI emptied as null, marked as theirs", () => {
    const { fields } = resolveSummary(input({ summary: phiEdit(null) }));

    expect(fields.summary.value).toBeNull();
    expect(fields.summary.source).toBe("PHI");
  });
});
