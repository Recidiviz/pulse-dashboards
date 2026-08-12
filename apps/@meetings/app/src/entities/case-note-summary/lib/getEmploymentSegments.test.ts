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

import { CaseNoteSummarySegment } from "../model/types";
import { getEmploymentSegments } from "./getEmploymentSegments";

const warn = jest.fn();

beforeEach(() => warn.mockClear());

/** Shorthand for a well-formed field with usable citation data. */
const field = (fieldValue: string) => ({
  fieldValue,
  quotes: [`quote for ${fieldValue}`],
  lastVerifiedDate: "2026-07-20",
});

/** Fixtures are partial by design; the cast keeps each case to just the relevant fields. */
const build = (fields: unknown) => fields as PrismaJson.CNIEmploymentFields;

const render = (segments: CaseNoteSummarySegment[] | null) =>
  segments?.map(({ content }) => content).join("");

describe("getEmploymentSegments", () => {
  describe("unemployed (1a)", () => {
    it("renders the bare sentence with no searchStatus", () => {
      const result = getEmploymentSegments(
        build({ primaryStatus: field("unemployed") }),
        warn,
      );
      expect(render(result)).toBe("is unemployed");
    });

    it("appends the search fragment", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("unemployed"),
          searchStatus: field("searching"),
        }),
        warn,
      );
      expect(render(result)).toBe(
        "is unemployed, and is actively searching for work",
      );
    });

    it("maps searchStatus=not_searching", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("unemployed"),
          searchStatus: field("not_searching"),
        }),
        warn,
      );
      expect(render(result)).toBe(
        "is unemployed, and is not currently searching",
      );
    });
  });

  describe("employed", () => {
    it("renders the bare sentence with no employers (1b)", () => {
      const result = getEmploymentSegments(
        build({ primaryStatus: field("employed"), employers: [] }),
        warn,
      );
      expect(render(result)).toBe("is employed");
    });

    it("renders a single employer with every field (1c)", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("employed"),
          employers: [
            {
              employmentType: field("employee_ft"),
              jobTitle: field("cashier"),
              employerName: field("Acme Corp"),
              employerLocation: field("Boise, ID"),
            },
          ],
        }),
        warn,
      );
      expect(render(result)).toBe(
        "is employed full-time as a cashier at Acme Corp in Boise, ID",
      );
    });

    it("omits fragments for absent optional fields (1c)", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("employed"),
          employers: [{ employerName: field("Acme Corp") }],
        }),
        warn,
      );
      expect(render(result)).toBe("is employed at Acme Corp");
    });

    it.each([
      ["contractor_1099", "is employed as a contractor at TechCo"],
      ["gig", "is employed doing gig work at TechCo"],
      ["day_labor", "is employed doing day labor at TechCo"],
      ["cash_informal", "is employed doing informal work at TechCo"],
      ["temp_agency", "is employed through a staffing agency at TechCo"],
      ["seasonal", "is employed seasonally at TechCo"],
      ["intern", "is employed as an intern at TechCo"],
      ["apprentice", "is employed as an apprentice at TechCo"],
    ])("maps employmentType=%s", (employmentType, expected) => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("employed"),
          employers: [
            {
              employmentType: field(employmentType),
              employerName: field("TechCo"),
            },
          ],
        }),
        warn,
      );
      expect(render(result)).toBe(expected);
    });

    it("maps the canonical employee_pt spelling", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("employed"),
          employers: [
            {
              employmentType: field("employee_pt"),
              employerName: field("Diner"),
            },
          ],
        }),
        warn,
      );
      expect(render(result)).toBe("is employed part-time at Diner");
      expect(warn).not.toHaveBeenCalled();
    });

    it("reorders a lone self-employed employer (1d)", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("employed"),
          employers: [
            {
              employmentType: field("self_employed"),
              jobTitle: field("consultant"),
              employerLocation: field("Denver, CO"),
              payRateAmount: field("$75/hour"),
            },
          ],
        }),
        warn,
      );
      expect(render(result)).toBe(
        "is self-employed as a consultant, in Denver, CO, earning $75/hour",
      );
    });

    it("joins two employers with `and` (1e)", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("employed"),
          employers: [
            {
              employmentType: field("employee_ft"),
              jobTitle: field("cashier"),
              employerName: field("Acme Corp"),
            },
            {
              employmentType: field("employee_pt"),
              employerName: field("BuildCo"),
            },
          ],
        }),
        warn,
      );
      expect(render(result)).toBe(
        "is employed full-time as a cashier at Acme Corp and part-time at BuildCo",
      );
    });

    it("joins three employers with an Oxford comma (1f)", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("employed"),
          employers: [
            {
              employmentType: field("employee_ft"),
              jobTitle: field("cashier"),
              employerName: field("Acme Corp"),
            },
            {
              employmentType: field("employee_pt"),
              employerName: field("BuildCo"),
            },
            { employerName: field("FastFood Inc.") },
          ],
        }),
        warn,
      );
      expect(render(result)).toBe(
        "is employed full-time as a cashier at Acme Corp, part-time at BuildCo, and at FastFood Inc.",
      );
    });
  });

  describe("citations", () => {
    it("attaches each field's quotes to its own segment", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("employed"),
          employers: [
            {
              employmentType: field("employee_pt"),
              employerName: field("Diner"),
            },
          ],
        }),
        warn,
      );

      expect(result).toEqual([
        {
          content: "is employed",
          citation: {
            quotes: ["quote for employed"],
            lastVerifiedDate: new Date(2026, 6, 20),
          },
        },
        { content: " " },
        {
          content: "part-time",
          citation: {
            quotes: ["quote for employee_pt"],
            lastVerifiedDate: new Date(2026, 6, 20),
          },
        },
        {
          content: " at Diner",
          citation: {
            quotes: ["quote for Diner"],
            lastVerifiedDate: new Date(2026, 6, 20),
          },
        },
      ]);
    });

    it("renders text without a citation when quotes are missing or empty", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: { fieldValue: "employed", quotes: [] },
          employers: [
            {
              employerName: {
                fieldValue: "Diner",
                lastVerifiedDate: "2026-07-20",
              },
            },
          ],
        }),
        warn,
      );

      expect(render(result)).toBe("is employed at Diner");
      expect(result?.every((segment) => !segment.citation)).toBe(true);
    });

    it("keeps the quotes when only the date is unusable", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: {
            fieldValue: "employed",
            quotes: ["still a real quote"],
            lastVerifiedDate: "not-a-date",
          },
        }),
        warn,
      );

      expect(result?.[0].citation).toEqual({
        quotes: ["still a real quote"],
        lastVerifiedDate: undefined,
      });
    });
  });

  describe("missing fields", () => {
    it.each([
      ["an empty object", {}],
      ["a blank fieldValue", { primaryStatus: field("   ") }],
      ["an unrecognized status", { primaryStatus: field("retired") }],
    ])("returns null for %s", (_label, cniFields) => {
      expect(getEmploymentSegments(build(cniFields), warn)).toBeNull();
      expect(warn).toHaveBeenCalled();
    });

    it.each([
      ["absent", {}],
      ["null", { employers: null }],
      ["empty", { employers: [] }],
      ["all empty entries", { employers: [{}, {}] }],
    ])(
      "falls back to the bare sentence when employers is %s",
      (_label, rest) => {
        const result = getEmploymentSegments(
          build({ primaryStatus: field("employed"), ...rest }),
          warn,
        );
        expect(render(result)).toBe("is employed");
      },
    );

    it("drops an empty employer instead of leaving a dangling separator", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("employed"),
          employers: [{}, { employerName: field("Acme Corp") }],
        }),
        warn,
      );
      expect(render(result)).toBe("is employed at Acme Corp");
    });

    it("omits an unknown enum fragment but keeps the rest of the sentence", () => {
      const result = getEmploymentSegments(
        build({
          primaryStatus: field("employed"),
          employers: [
            {
              employmentType: field("astronaut"),
              employerName: field("Acme Corp"),
            },
          ],
        }),
        warn,
      );

      expect(render(result)).toBe("is employed at Acme Corp");
      expect(warn).toHaveBeenCalledWith(
        'no template fragment for employmentType="astronaut"',
      );
    });
  });
});
