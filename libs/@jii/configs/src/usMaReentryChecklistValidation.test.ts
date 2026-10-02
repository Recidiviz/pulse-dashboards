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

import { findInvalidReentryChecklistShowIfConditions } from "./usMaReentryChecklistValidation";

test("every checklist showIf condition references a real option", () => {
  expect(findInvalidReentryChecklistShowIfConditions()).toEqual([]);
});

test("flags a showIf condition that references an unknown option", () => {
  expect(
    findInvalidReentryChecklistShowIfConditions({
      BACKUP_HOUSING: {
        showIf: {
          questionId: "HOUSING",
          operator: "equals",
          value: "NOT_A_REAL_OPTION",
        },
      },
    }),
  ).toEqual([
    'BACKUP_HOUSING: showIf references option "NOT_A_REAL_OPTION" which is not ' +
      'a valid option of question "HOUSING" (valid: FAMILY, FRIENDS_OR_ROOMMATES, ' +
      "LONG_TERM_RESIDENTIAL_PROGRAM, SOBER_OR_ROOMING_HOUSE, OWN_PLACE, UNSURE, " +
      "DECLINED_TO_ANSWER)",
  ]);
});
