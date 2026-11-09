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

import { Timestamp } from "firebase/firestore";

import {
  paroleBoardReportSchema,
  paroleBoardReportsForResidentSchema,
} from "./reportSchema";

const EDITED_AT = new Date("2026-11-02T15:00:00Z");

const phiEdit = <T>(value: T) => ({
  value,
  updatedBy: "phi@us_id.gov",
  updatedAt: EDITED_AT,
});

const baseReport = {
  stateCode: "US_ID",
  pseudonymizedId: "pid123",
  hearing: { hearingDate: "2026-12-01", hearingType: "Regular Hearing" },
  status: "IN_PROGRESS",
  createdBy: "phi@us_id.gov",
  createdAt: EDITED_AT,
  updatedBy: "phi@us_id.gov",
  updatedAt: EDITED_AT,
};

const withOffenseInformation = (offenseInformation: unknown) => ({
  ...baseReport,
  sections: { offenseInformation },
});

describe("paroleBoardReportSchema", () => {
  it("parses a report with Offense Information input", () => {
    const report = paroleBoardReportSchema.parse(
      withOffenseInformation({
        fields: {
          psychologicalEvaluation: phiEdit("NONE"),
          victim: phiEdit("YES"),
        },
        rows: {
          "1001": {
            source: "ATLAS",
            atlasLabel: "Robbery §18-6501, Case # CR25-08-1142",
            fields: { sentencingDate: phiEdit("2025-08-15") },
          },
        },
      }),
    );

    expect(report.sections.offenseInformation?.fields?.victim?.value).toBe(
      "YES",
    );
    expect(
      report.sections.offenseInformation?.rows?.["1001"].fields?.sentencingDate
        ?.value,
    ).toBe("2025-08-15");
  });

  it("parses Firestore Timestamps as well as Dates", () => {
    const createdAt = Timestamp.fromDate(EDITED_AT);

    expect(
      paroleBoardReportSchema.parse({ ...baseReport, createdAt }).createdAt,
    ).toBe(createdAt);
  });

  it("parses a report with no sections, as a report created before any section existed", () => {
    expect(paroleBoardReportSchema.parse(baseReport).sections).toEqual({});
  });

  it("accepts a null value, which records that the PHI cleared the field", () => {
    const report = paroleBoardReportSchema.parse(
      withOffenseInformation({ fields: { victim: phiEdit(null) } }),
    );

    expect(report.sections.offenseInformation?.fields?.victim?.value).toBe(
      null,
    );
  });

  it("parses a row the PHI removed, which has no edited fields", () => {
    const report = paroleBoardReportSchema.parse(
      withOffenseInformation({
        rows: {
          "1001": {
            source: "ATLAS",
            removed: { by: "phi@us_id.gov", at: EDITED_AT },
          },
        },
      }),
    );

    expect(report.sections.offenseInformation?.rows?.["1001"].removed).toEqual({
      by: "phi@us_id.gov",
      at: EDITED_AT,
    });
  });

  it("rejects a status outside IN_PROGRESS, SUBMITTED and ARCHIVED", () => {
    expect(
      paroleBoardReportSchema.safeParse({ ...baseReport, status: "DRAFT" })
        .success,
    ).toBe(false);
  });

  it.each([
    ["Psychological Evaluation", { psychologicalEvaluation: phiEdit("YES") }],
    ["Victim", { victim: phiEdit("MAYBE") }],
  ])("rejects a %s value outside its options", (_label, fields) => {
    expect(
      paroleBoardReportSchema.safeParse(withOffenseInformation({ fields }))
        .success,
    ).toBe(false);
  });

  it("rejects a hearing date that is not YYYY-MM-DD", () => {
    expect(
      paroleBoardReportSchema.safeParse({
        ...baseReport,
        hearing: { hearingDate: "12/01/2026" },
      }).success,
    ).toBe(false);
  });

  it("rejects a sentencing date that is not YYYY-MM-DD", () => {
    expect(
      paroleBoardReportSchema.safeParse(
        withOffenseInformation({
          rows: {
            "1001": {
              source: "ATLAS",
              fields: { sentencingDate: phiEdit("08/15/2025") },
            },
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("parses a report with Past Actions rows the PHI added", () => {
    const rowId = "phi_1793800000000_a1b2c3d4";
    const report = paroleBoardReportSchema.parse({
      ...baseReport,
      sections: {
        pastActions: {
          rows: {
            [rowId]: {
              source: "PHI",
              fields: {
                date: phiEdit("2015-03"),
                notes: phiEdit("Sentenced, entered custody"),
              },
            },
          },
        },
      },
    });

    expect(report.sections.pastActions?.rows?.[rowId].fields?.date?.value).toBe(
      "2015-03",
    );
  });

  it.each(["2015-03-01", "2015-13", "2015-3", "03/2015"])(
    "rejects a Past Actions date of %s, which is not a YYYY-MM month",
    (date) => {
      expect(
        paroleBoardReportSchema.safeParse({
          ...baseReport,
          sections: {
            pastActions: {
              rows: {
                phi_1: { source: "PHI", fields: { date: phiEdit(date) } },
              },
            },
          },
        }).success,
      ).toBe(false);
    },
  );

  it("parses Past Actions notes longer than the input allows, so one long note can't break the report", () => {
    expect(
      paroleBoardReportSchema.safeParse({
        ...baseReport,
        sections: {
          pastActions: {
            rows: {
              phi_1: {
                source: "PHI",
                fields: { notes: phiEdit("x".repeat(300)) },
              },
            },
          },
        },
      }).success,
    ).toBe(true);
  });

  it("rejects a row without a source", () => {
    expect(
      paroleBoardReportSchema.safeParse(
        withOffenseInformation({
          rows: {
            "1001": { fields: { sentencingDate: phiEdit("2025-08-15") } },
          },
        }),
      ).success,
    ).toBe(false);
  });
});

describe("paroleBoardReportsForResidentSchema", () => {
  it("parses a resident with no report in progress", () => {
    expect(
      paroleBoardReportsForResidentSchema.parse({
        stateCode: "US_ID",
        activeReportId: null,
        latestReport: {
          reportId: "report1",
          status: "SUBMITTED",
          hearingDate: "2026-03-24",
        },
      }).activeReportId,
    ).toBeNull();
  });

  it("parses a resident with no reports yet", () => {
    expect(
      paroleBoardReportsForResidentSchema.parse({
        stateCode: "US_ID",
        activeReportId: null,
        latestReport: null,
      }).latestReport,
    ).toBeNull();
  });

  it("rejects a latest report hearing date that is not YYYY-MM-DD", () => {
    expect(
      paroleBoardReportsForResidentSchema.safeParse({
        stateCode: "US_ID",
        activeReportId: null,
        latestReport: {
          reportId: "report1",
          status: "SUBMITTED",
          hearingDate: "2026-03-24T00:00:00Z",
        },
      }).success,
    ).toBe(false);
  });
});
