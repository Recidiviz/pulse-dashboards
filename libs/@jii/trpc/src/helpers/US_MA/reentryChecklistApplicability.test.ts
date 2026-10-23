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

import { reentryChecklistConfig, reentryChecklistItemIds } from "~@jii/configs";

import {
  getApplicableReentryChecklistItems,
  isReentryChecklistItemApplicable,
} from "./reentryChecklistApplicability";

describe("isReentryChecklistItemApplicable", () => {
  it("is always applicable when the item has no showIf", () => {
    expect(isReentryChecklistItemApplicable("BACKUP_HOUSING", {})).toBe(true);
  });

  it("is applicable when a RADIO answer matches one of the any conditions", () => {
    expect(
      isReentryChecklistItemApplicable("HOUSING_PLAN_AGREEMENT", {
        HOUSING: "FAMILY",
      }),
    ).toBe(true);
    expect(
      isReentryChecklistItemApplicable("HOUSING_PLAN_AGREEMENT", {
        HOUSING: "FRIEND",
      }),
    ).toBe(true);
  });

  it("is not applicable when the RADIO answer matches none of the any conditions", () => {
    expect(
      isReentryChecklistItemApplicable("HOUSING_PLAN_AGREEMENT", {
        HOUSING: "OWN_PLACE",
      }),
    ).toBe(false);
  });

  it("is not applicable when the referenced question is unanswered", () => {
    expect(isReentryChecklistItemApplicable("HOUSING_PLAN_AGREEMENT", {})).toBe(
      false,
    );
  });

  it("is applicable when a CHECKBOX answer has the condition's option checked", () => {
    expect(
      isReentryChecklistItemApplicable(
        "CONFIRMED_FAMILY_AND_FRIENDS_TRANSPORTATION",
        { TRANSPORTATION: ["PUBLIC_TRANSIT", "FAMILY_OR_FRIENDS"] },
      ),
    ).toBe(true);
  });

  it("is not applicable when a CHECKBOX answer has the condition's option unchecked", () => {
    expect(
      isReentryChecklistItemApplicable(
        "CONFIRMED_FAMILY_AND_FRIENDS_TRANSPORTATION",
        { TRANSPORTATION: ["PUBLIC_TRANSIT"] },
      ),
    ).toBe(false);
    expect(
      isReentryChecklistItemApplicable(
        "CONFIRMED_FAMILY_AND_FRIENDS_TRANSPORTATION",
        { TRANSPORTATION: [] },
      ),
    ).toBe(false);
    expect(
      isReentryChecklistItemApplicable(
        "CONFIRMED_FAMILY_AND_FRIENDS_TRANSPORTATION",
        {},
      ),
    ).toBe(false);
  });
});

describe("getApplicableReentryChecklistItems", () => {
  const itemsWithNoShowIf = reentryChecklistItemIds.filter(
    (id) => !reentryChecklistConfig[id].showIf,
  );

  it("returns only the items with no showIf when nothing has been answered", () => {
    expect(getApplicableReentryChecklistItems({}).sort()).toEqual(
      [...itemsWithNoShowIf].sort(),
    );
  });

  it("returns only the items applicable to the given answers", () => {
    const applicable = getApplicableReentryChecklistItems({
      HOUSING: "LONG_TERM_RESIDENTIAL_PROGRAM",
    });

    // Items with no showIf are always included;
    // "LONG_TERM_RESIDENTIAL_PROGRAM" also satisfies every housing-program item
    expect(applicable.sort()).toEqual(
      [
        ...itemsWithNoShowIf,
        "HAS_HOUSING_LOCATION_PREFERENCE",
        "HAS_HOUSING_PROGRAM_RENT_PLAN",
        "HAS_PAID_HOUSING_PROGRAM_DEPOSIT",
        "DISCUSSED_HOUSING_WITH_SPECIALIST",
        "RESEARCHED_HOUSING_RESOURCES",
      ].sort(),
    );
  });
});
