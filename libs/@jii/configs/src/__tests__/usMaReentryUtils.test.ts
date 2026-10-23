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

import { conditionIsMet } from "../usMaReentryUtils";

describe("conditionIsMet", () => {
  // No checklist item uses notEquals yet, so these test the condition directly
  const radioNotEqualsYes = {
    questionId: "HEALTHCARE_NEEDED",
    operator: "notEquals",
    value: "YES",
  } as const;
  const checkboxNotEqualsOwnCar = {
    questionId: "TRANSPORTATION",
    operator: "notEquals",
    value: "OWN_CAR",
  } as const;

  it("is met when a RADIO answer differs from a notEquals value", () => {
    expect(conditionIsMet(radioNotEqualsYes, { HEALTHCARE_NEEDED: "NO" })).toBe(
      true,
    );
  });

  it("is not met when a RADIO answer matches a notEquals value", () => {
    expect(
      conditionIsMet(radioNotEqualsYes, { HEALTHCARE_NEEDED: "YES" }),
    ).toBe(false);
  });

  it("is met when a CHECKBOX answer doesn't include a notEquals value", () => {
    expect(
      conditionIsMet(checkboxNotEqualsOwnCar, { TRANSPORTATION: ["BIKE"] }),
    ).toBe(true);
    expect(
      conditionIsMet(checkboxNotEqualsOwnCar, { TRANSPORTATION: [] }),
    ).toBe(true);
  });

  it("is not met when a CHECKBOX answer includes a notEquals value", () => {
    expect(
      conditionIsMet(checkboxNotEqualsOwnCar, {
        TRANSPORTATION: ["BIKE", "OWN_CAR"],
      }),
    ).toBe(false);
  });

  it("is not met for a notEquals condition on an unanswered question", () => {
    expect(conditionIsMet(radioNotEqualsYes, {})).toBe(false);
    expect(conditionIsMet(checkboxNotEqualsOwnCar, {})).toBe(false);
  });
});
