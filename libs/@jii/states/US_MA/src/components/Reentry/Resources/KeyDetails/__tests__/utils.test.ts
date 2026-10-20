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

import { UsMaTFunction } from "~@jii/translation";

import { loadUsMaTranslations } from "../../__tests__/testUtils";
import { HousingAttributes } from "../../types";
import {
  getKeyDetails,
  getLengthOfStayValue,
  getWeeklyRentDetailsCopy,
  getWhoCanStayValue,
} from "../utils";

let t: UsMaTFunction;

beforeAll(async () => {
  t = await loadUsMaTranslations();
});

const housing = (
  attrs: Partial<HousingAttributes> = {},
): HousingAttributes => ({
  category: "Housing",
  ...attrs,
});

describe("getWhoCanStayValue", () => {
  test("shows gender and bed count", () => {
    expect(getWhoCanStayValue(["Co-ed"], 50, t)).toBe("Co-ed (50 beds)");
  });

  test("uses the singular for one bed", () => {
    expect(getWhoCanStayValue(["Female"], 1, t)).toBe("Female (1 bed)");
  });

  test("lists several genders in option order", () => {
    expect(getWhoCanStayValue(["Female", "Male"], undefined, t)).toBe(
      "Male, Female",
    );
  });

  test("shows the bed count alone without a gender tag", () => {
    expect(getWhoCanStayValue(["Parolees Accepted"], 12, t)).toBe("12 beds");
  });

  test("falls back without gender or beds", () => {
    expect(getWhoCanStayValue([], undefined, t)).toBe("Not listed");
  });

  // TODO(REE-204): Update once product decides how to show a bed count of 0.
  test("shows a bed count of 0", () => {
    expect(getWhoCanStayValue(["Co-ed"], 0, t)).toBe("Co-ed (0 beds)");
    expect(getWhoCanStayValue([], 0, t)).toBe("0 beds");
  });
});

describe("getLengthOfStayValue", () => {
  test("shows no time limit for the 999-month max", () => {
    expect(
      getLengthOfStayValue(
        housing({ programLengthMonths: { min: 0, max: 999 } }),
        t,
      ),
    ).toBe("No time limit");
  });

  test("shows the minimum for a 999-month max with a minimum", () => {
    expect(
      getLengthOfStayValue(
        housing({ programLengthMonths: { min: 6, max: 999 } }),
        t,
      ),
    ).toBe("6+ months");
  });

  test("shows a range starting at 0 as up to the max", () => {
    expect(
      getLengthOfStayValue(
        housing({ programLengthMonths: { min: 0, max: 1 } }),
        t,
      ),
    ).toBe("Up to 1 month");
    expect(
      getLengthOfStayValue(
        housing({ programLengthMonths: { min: 0, max: 3 } }),
        t,
      ),
    ).toBe("Up to 3 months");
  });

  test("shows a single length", () => {
    expect(
      getLengthOfStayValue(
        housing({ programLengthMonths: { min: 6, max: 6 } }),
        t,
      ),
    ).toBe("6 months");
  });

  test("uses the singular for one month", () => {
    expect(
      getLengthOfStayValue(
        housing({ programLengthMonths: { min: 1, max: 1 } }),
        t,
      ),
    ).toBe("1 month");
  });

  test("shows a range", () => {
    expect(
      getLengthOfStayValue(
        housing({ programLengthMonths: { min: 3, max: 6 } }),
        t,
      ),
    ).toBe("3–6 months");
  });

  test("falls back without a program length", () => {
    expect(getLengthOfStayValue(housing(), t)).toBe("Not listed");
  });
});

describe("getWeeklyRentDetailsCopy", () => {
  test("shows free for zero rent", () => {
    expect(
      getWeeklyRentDetailsCopy(housing({ weeklyRent: { min: 0, max: 0 } }), t),
    ).toBe("Free");
  });

  test("shows a single amount, keeping cents", () => {
    expect(
      getWeeklyRentDetailsCopy(
        housing({ weeklyRent: { min: 187.5, max: 187.5 } }),
        t,
      ),
    ).toBe("$187.50");
  });

  test("shows a range in whole dollars", () => {
    expect(
      getWeeklyRentDetailsCopy(
        housing({ weeklyRent: { min: 150, max: 175 } }),
        t,
      ),
    ).toBe("$150–$175");
  });

  test("shows a share of income", () => {
    expect(
      getWeeklyRentDetailsCopy(housing({ rentAsIncomePercent: 30 }), t),
    ).toBe("30% of income");
  });

  test("shows a share of income of 0%", () => {
    expect(
      getWeeklyRentDetailsCopy(housing({ rentAsIncomePercent: 0 }), t),
    ).toBe("0% of income");
  });

  test("lists both a dollar amount and a share of income", () => {
    expect(
      getWeeklyRentDetailsCopy(
        housing({
          weeklyRent: { min: 150, max: 175 },
          rentAsIncomePercent: 30,
        }),
        t,
      ),
    ).toBe("$150–$175 or 30% of income");
  });

  test("falls back without rent", () => {
    expect(getWeeklyRentDetailsCopy(housing(), t)).toBe("Not listed");
  });
});

describe("getKeyDetails", () => {
  test("returns the cards in design order, with No for a missing Accepts tag", () => {
    expect(
      getKeyDetails(
        {
          tags: ["Co-ed", "Sex Offenders Accepted", "Arson Offenders Accepted"],
        },
        housing({
          numBeds: 50,
          programLengthMonths: { min: 0, max: 999 },
          weeklyRent: { min: 150, max: 150 },
        }),
        t,
      ),
    ).toEqual([
      { label: "Who can stay", value: "Co-ed (50 beds)" },
      { label: "Length of stay", value: "No time limit" },
      { label: "Weekly rent", value: "$150" },
      { label: "Accepts: sex offenses", value: "Yes" },
      { label: "Accepts: parolees", value: "No" },
      { label: "Accepts: arson offenses", value: "Yes" },
    ]);
  });
});
