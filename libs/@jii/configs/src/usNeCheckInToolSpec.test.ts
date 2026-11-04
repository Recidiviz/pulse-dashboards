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
  CheckInQuestionConfig,
  checkInQuestionConfig,
  CheckInQuestionId,
  checkInToolSpecs,
  checkInVersions,
} from "./usNeCheckInToolSpec";

describe.each(checkInVersions)("Check-in version %s", (version) => {
  test("no repeated section IDs", () => {
    const sections = checkInToolSpecs[version].map(({ id }) => id);
    expect(sections).toHaveLength(new Set(sections).size);
  });

  const questions = checkInToolSpecs[version].flatMap(
    ({ questions }) => questions,
  );

  test("no repeated question IDs", () => {
    expect(questions).toHaveLength(new Set(questions).size);
  });

  test("no repeated answer IDs within a question", () => {
    Object.values(checkInQuestionConfig).forEach((config) => {
      if (config.format === "CHECKBOX" || config.format === "RADIO") {
        expect(config.answers).toHaveLength(new Set(config.answers).size);
      }
    });
  });

  test("every showIf references a real option from a previous multiple-choice question", () => {
    for (const [id, config] of Object.entries(checkInQuestionConfig) as [
      CheckInQuestionId,
      CheckInQuestionConfig,
    ][]) {
      if (config.showIf) {
        const dependencyConfig =
          checkInQuestionConfig[config.showIf.questionId];

        // The showIf should reference a real option
        expect(dependencyConfig.format).toBeOneOf(["RADIO", "CHECKBOX"]);
        // @ts-expect-error the above line guarantees this will be true
        const validOptionIds: readonly string[] = dependencyConfig.answers;
        expect(validOptionIds).toInclude(config.showIf.value);

        // This dependent question should come before the real question in the tool spec
        const position = questions.indexOf(id);
        if (position === -1) continue;

        const dependencyPosition = questions.indexOf(config.showIf.questionId);
        expect(dependencyPosition).not.toBe(-1);
        expect(position).toBeGreaterThan(dependencyPosition);
      }
    }
  });
});
