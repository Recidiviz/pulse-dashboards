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

import * as Sentry from "@sentry/react-native";

import { Person } from "~@meetings/app/shared/api";

import {
  CaseNoteSummarySegment,
  EmploymentSummary,
  HousingSummary,
} from "../model/types";
import { getCaseNoteSummarySegments } from "./getCaseNoteSummarySegments";

jest.mock("@sentry/react-native", () => ({
  logger: { warn: jest.fn() },
}));

const mockSentryWarn = Sentry.logger.warn as jest.Mock;

const person = { fullName: "Mike Woods", personId: 123456n } as Person;

const field = (fieldValue: string) => ({
  fieldValue,
  quotes: [`quote for ${fieldValue}`],
  lastVerifiedDate: "2026-07-20",
});

const employmentSummary = (cniFields: unknown) =>
  ({ cniFields }) as EmploymentSummary;
const housingSummary = (cniFields: unknown) =>
  ({ cniFields }) as HousingSummary;

const employment = employmentSummary({
  primaryStatus: field("employed"),
  employers: [
    { employmentType: field("employee_pt"), employerName: field("Diner") },
  ],
});

const housing = housingSummary({
  primaryStatus: field("housed"),
  housedType: field("dependent"),
  address: field("123 Jackson St"),
});

const render = (segments: CaseNoteSummarySegment[] | null) =>
  segments?.map(({ content }) => content).join("");

beforeEach(() => mockSentryWarn.mockClear());

describe("getCaseNoteSummarySegments", () => {
  it("joins both categories after the client's name", () => {
    const result = getCaseNoteSummarySegments({ employment, housing, person });

    expect(render(result)).toBe(
      "Mike Woods is employed part-time at Diner, is housed and dependent on others for housing at 123 Jackson St.",
    );
  });

  it("renders employment alone", () => {
    const result = getCaseNoteSummarySegments({ employment, person });
    expect(render(result)).toBe("Mike Woods is employed part-time at Diner.");
  });

  it("renders housing alone", () => {
    const result = getCaseNoteSummarySegments({ housing, person });
    expect(render(result)).toBe(
      "Mike Woods is housed and dependent on others for housing at 123 Jackson St.",
    );
  });

  it("leaves the name and period uncited, and cites the templated phrases", () => {
    const result = getCaseNoteSummarySegments({ employment, person });

    expect(result?.[0]).toEqual({ content: "Mike Woods " });
    expect(result?.at(-1)).toEqual({ content: "." });
    expect(
      result
        ?.filter((segment) => segment.citation)
        .map(({ content }) => content),
    ).toEqual(["is employed", "part-time", " at Diner"]);
  });

  describe("missing data", () => {
    it("drops a category that matched no template, without a stray comma", () => {
      const result = getCaseNoteSummarySegments({
        employment: employmentSummary({ employers: [] }),
        housing,
        person,
      });

      expect(render(result)).toBe(
        "Mike Woods is housed and dependent on others for housing at 123 Jackson St.",
      );
    });

    it.each([
      ["both categories absent", {}],
      [
        "both categories have no fields",
        { employment: employmentSummary({}), housing: housingSummary({}) },
      ],
      [
        "neither category has a primaryStatus",
        {
          employment: employmentSummary({ employers: [] }),
          housing: housingSummary({}),
        },
      ],
    ])("returns null when %s", (_label, summaries) => {
      expect(getCaseNoteSummarySegments({ ...summaries, person })).toBeNull();
    });

    it("reports the client ID to Sentry when nothing could be templated", () => {
      getCaseNoteSummarySegments({
        employment: employmentSummary({ primaryStatus: field("retired") }),
        person,
      });

      // The unrecognized status is reported too; the final gap is what tells us
      // the client rendered nothing at all.
      expect(mockSentryWarn).toHaveBeenLastCalledWith(
        "case_note_summary.template_gap",
        {
          clientId: "123456",
          reason: "no sentence template matched any summary category",
        },
      );
    });

    it("keeps the client ID on every reported gap", () => {
      getCaseNoteSummarySegments({
        employment: employmentSummary({ primaryStatus: field("retired") }),
        person,
      });

      expect(
        mockSentryWarn.mock.calls.every(
          ([event, attrs]) =>
            event === "case_note_summary.template_gap" &&
            attrs.clientId === "123456",
        ),
      ).toBe(true);
    });
  });
});
