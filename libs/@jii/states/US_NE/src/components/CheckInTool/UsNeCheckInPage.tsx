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

import assertNever from "assert-never";

import { checkInQuestionConfig, checkInToolSpec } from "~@jii/configs";

import { UsNeCheckInCheckboxQuestion } from "./UsNeCheckInCheckboxQuestion";
import { UsNeCheckInFreeTextQuestion } from "./UsNeCheckInFreeTextQuestion";
import { UsNeCheckInRadioQuestion } from "./UsNeCheckInRadioQuestion";

export const UsNeCheckInPage = () => {
  // TODO(OBT-47841): Show just one question per page
  return checkInToolSpec.map(({ questions }) =>
    questions.map((id) => {
      const config = checkInQuestionConfig[id];

      switch (config.format) {
        case "RADIO":
          return (
            <UsNeCheckInRadioQuestion
              key={id}
              id={id}
              answers={config.answers}
            />
          );
        case "CHECKBOX":
          return (
            <UsNeCheckInCheckboxQuestion
              key={id}
              id={id}
              answers={config.answers}
            />
          );
        case "FREE_TEXT":
          return <UsNeCheckInFreeTextQuestion key={id} id={id} />;
        default:
          return assertNever(config);
      }
    }),
  );
};
