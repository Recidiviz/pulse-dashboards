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

import {
  calculateUsMiAgeOptionSelection,
  miMaleInitialClassificationQuestions,
  miMaleReviewClassificationQuestions,
  usMiFemaleSecurityLevels,
  usMiMaleSecurityLevels,
  usMiOverrideSelections,
} from "~datatypes";

import { overridesCompleted } from "../UsMiInitialClassification2026Form";

describe("calculateUsMiAgeOptionSelection", () => {
  // Options: 25 or Younger, 25 or Younger with good behavior, 26-30, 31-35,
  // 36-40, 41-49, 50 or Older
  const ageQuestion = miMaleReviewClassificationQuestions[0].questions[0];

  test.each`
    age   | goodBehavior | expected
    ${25} | ${false}     | ${0}
    ${25} | ${true}      | ${1}
    ${26} | ${false}     | ${2}
    ${26} | ${true}      | ${2}
    ${31} | ${false}     | ${3}
    ${37} | ${false}     | ${4}
    ${41} | ${false}     | ${5}
    ${50} | ${false}     | ${6}
    ${50} | ${true}      | ${6}
  `(
    "selects option $expected at age $age when good behavior is $goodBehavior",
    ({ age, goodBehavior, expected }) => {
      expect(
        calculateUsMiAgeOptionSelection(ageQuestion, {
          age,
          noViolentOrFightThreatenPowIncInLast12Months: goodBehavior,
          servedAtLeastOneYear: goodBehavior,
        }),
      ).toBe(expected);
    },
  );

  // Options: 25 or Younger, 26-30, 31-35, 36-40, 41-49, 50 or Older
  const initialAgeQuestion =
    miMaleInitialClassificationQuestions[0].questions[0];

  test.each`
    age   | goodBehavior | expected
    ${25} | ${false}     | ${0}
    ${25} | ${true}      | ${0}
    ${22} | ${true}      | ${0}
    ${26} | ${true}      | ${1}
    ${50} | ${true}      | ${5}
  `(
    "ignores good behavior on the initial question: option $expected at age $age when good behavior is $goodBehavior",
    ({ age, goodBehavior, expected }) => {
      expect(
        calculateUsMiAgeOptionSelection(initialAgeQuestion, {
          age,
          noViolentOrFightThreatenPowIncInLast12Months: goodBehavior,
          servedAtLeastOneYear: goodBehavior,
        }),
      ).toBe(expected);
    },
  );
});

describe("overridesCompleted", () => {
  // Level selections are dropdown indexes with the placeholder at 0, so on the
  // old four-level list Level V was 4.
  const formerLevelVSelection = 4;

  test.each`
    formData                                                                    | levels                      | expected
    ${{}}                                                                       | ${usMiFemaleSecurityLevels} | ${true}
    ${{ override1_1Selection: 2 }}                                              | ${usMiFemaleSecurityLevels} | ${false}
    ${{ override1_1Selection: 2, override1_2Selection: 0 }}                     | ${usMiFemaleSecurityLevels} | ${false}
    ${{ override1_1Selection: 2, override1_2Selection: 3 }}                     | ${usMiFemaleSecurityLevels} | ${true}
    ${{ override1_1Selection: 2, override1_2Selection: formerLevelVSelection }} | ${usMiFemaleSecurityLevels} | ${false}
    ${{ override2_1Selection: 1, override2_2Selection: formerLevelVSelection }} | ${usMiFemaleSecurityLevels} | ${false}
    ${{ override1_1Selection: 2, override1_2Selection: formerLevelVSelection }} | ${usMiMaleSecurityLevels}   | ${true}
  `("returns $expected for $formData", ({ formData, levels, expected }) => {
    expect(overridesCompleted(formData, usMiOverrideSelections, levels)).toBe(
      expected,
    );
  });
});
