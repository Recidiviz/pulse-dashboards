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
  calculateUsMiClassificationLevels,
  calculateUsMiLevelIndex,
} from "../utils";

describe("calculateUsMiLevelIndex", () => {
  it.each([
    [0, 0],
    [7.1, 0],
    [7.2, 1],
    [19.2, 1],
    [19.3, 2],
    [49.3, 3],
    [60, 3],
    [-2.6, 0],
  ])("puts a score of %s in level index %s", (score, expected) => {
    expect(calculateUsMiLevelIndex(score)).toBe(expected);
  });
});

describe("calculateUsMiClassificationLevels", () => {
  it("uses the calculated level for true and actual when there are no overrides", () => {
    expect(
      calculateUsMiClassificationLevels({
        totalScore: 10,
        currentLevel: "Level II",
      }),
    ).toEqual({
      calculatedLevelIndex: 1,
      calculatedLevel: "Level II",
      trueLevel: "Level II",
      actualLevel: "Level II",
      levelChange: undefined,
    });
  });

  it("carries a departure through to the actual level when there is no waiver", () => {
    const levels = calculateUsMiClassificationLevels({
      totalScore: 10,
      // Selection 3 is the third level, Level IV
      override1_2Selection: 3,
      currentLevel: "Level II",
    });
    expect(levels.trueLevel).toBe("Level IV");
    expect(levels.actualLevel).toBe("Level IV");
    expect(levels.levelChange).toBe("INCREASE");
  });

  it("uses the waiver level as the actual level over the departure", () => {
    const levels = calculateUsMiClassificationLevels({
      totalScore: 10,
      override1_2Selection: 3,
      override2_2Selection: 1,
      currentLevel: "Level II",
    });
    expect(levels.trueLevel).toBe("Level IV");
    expect(levels.actualLevel).toBe("Level I");
    expect(levels.levelChange).toBe("DECREASE");
  });

  it("reports no change when the waiver level matches the current level", () => {
    const levels = calculateUsMiClassificationLevels({
      totalScore: 30,
      override2_2Selection: 2,
      currentLevel: "Level II",
    });
    expect(levels.actualLevel).toBe("Level II");
    expect(levels.levelChange).toBeUndefined();
  });

  it("treats a selection of 0 as no override", () => {
    const levels = calculateUsMiClassificationLevels({
      totalScore: 30,
      override1_2Selection: 0,
      override2_2Selection: 0,
      currentLevel: "Level IV",
    });
    expect(levels.trueLevel).toBe("Level IV");
    expect(levels.actualLevel).toBe("Level IV");
  });

  it.each([["Unknown"], [undefined]])(
    "reports no change when the current level is %s",
    (currentLevel) => {
      const levels = calculateUsMiClassificationLevels({
        totalScore: 55,
        currentLevel,
      });
      expect(levels.actualLevel).toBe("Level V");
      expect(levels.levelChange).toBeUndefined();
    },
  );
});
