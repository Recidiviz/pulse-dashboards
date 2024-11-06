// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import tk from "timekeeper";

import { OpportunityType } from "~datatypes";

import { DENIED_UPDATE } from "../testUtils";
import { Opportunity } from "../types";
import { monthsOrDaysRemainingFromToday } from "../utils/criteriaUtils";
import { countOpportunities } from "../utils/generateHeadersUtils";

vi.mock("../../subscriptions");
vi.mock("firebase/firestore");
vi.mock("../Forms/FormBase");

describe("monthsOrDaysRemainingFromToday", () => {
  beforeEach(() => {
    tk.freeze(new Date(2023, 1, 23));
  });

  afterAll(() => {
    tk.reset();
  });

  test("months remaining", () => {
    expect(monthsOrDaysRemainingFromToday(new Date(2023, 5, 23))).toEqual(
      "4 more months",
    );
  });

  test("days remaining", () => {
    expect(monthsOrDaysRemainingFromToday(new Date(2023, 1, 30))).toEqual(
      "7 more days",
    );
  });
});

describe("Generate counts for opportunities", () => {
  const emptyOppsList: Opportunity[] = [];

  const aOpps = [
    {
      type: "mockUsXxOpp" as OpportunityType,
      config: {},
    },
    {
      type: "mockUsXxOpp" as OpportunityType,
      config: {},
    },
    {
      type: "mockUsXxOpp" as OpportunityType,
      denial: DENIED_UPDATE,
      config: {},
    },
  ] as Opportunity[];

  const customConfig = {
    countByFunction: (opportunities: Opportunity[]) =>
      opportunities.filter((opp) => opp.isSnoozed).length,
  };

  const bOpps = [
    {
      type: "mockUsXxTwoOpp" as OpportunityType,
      isSnoozed: true,
      config: customConfig,
    },
    {
      type: "mockUsXxTwoOpp" as OpportunityType,
      isSnoozed: false,
      config: customConfig,
    },
    {
      type: "mockUsXxTwoOpp" as OpportunityType,
      isSnoozed: true,
      config: customConfig,
    },
  ] as Opportunity[];

  const baseTests = [
    [aOpps, 2],
    [bOpps, 2],
    [emptyOppsList, 0],
  ];

  it.each(baseTests)(
    `should count opportunities %o properly when type is %s (TEST CASE %#)`,
    (opps, expected) =>
      expect(countOpportunities(opps as Opportunity[])).toEqual(expected),
  );

  it(`should throw an error when the opportunities are different types`, () =>
    expect(() =>
      countOpportunities([...aOpps, ...bOpps] as Opportunity[]),
    ).toThrowError());
});
