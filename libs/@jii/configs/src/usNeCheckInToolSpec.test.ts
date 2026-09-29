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

import { checkInQuestionConfig, checkInToolSpec } from "./usNeCheckInToolSpec";

test("no repeated section IDs", () => {
  const sections = checkInToolSpec.map(({ id }) => id);
  expect(sections).toHaveLength(new Set(sections).size);
});

test("no repeated question IDs", () => {
  const questions = checkInToolSpec.flatMap(({ questions }) => questions);
  expect(questions).toHaveLength(new Set(questions).size);
});

// can be removed if for some reason we purposely add a question to the config
// that isn't in the spec
test("all questions are included in the spec", () => {
  const questions = checkInToolSpec.flatMap(({ questions }) => questions);
  expect(new Set(questions)).toEqual(
    new Set(Object.keys(checkInQuestionConfig)),
  );
});

test("no repeated answer IDs within a question", () => {
  Object.values(checkInQuestionConfig).forEach((config) => {
    if (config.format === "CHECKBOX" || config.format === "RADIO") {
      expect(config.answers).toHaveLength(new Set(config.answers).size);
    }
  });
});
