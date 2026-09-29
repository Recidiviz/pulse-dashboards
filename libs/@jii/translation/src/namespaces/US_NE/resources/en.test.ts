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
  checkInStandardRadioAnswers,
} from "~@jii/configs";

import englishCopy from "./en.json";

type CheckInStandardRadioAnswer = (typeof checkInStandardRadioAnswers)[number];
export const isCheckInStandardRadioAnswer = (s: string) =>
  checkInStandardRadioAnswers.includes(s as CheckInStandardRadioAnswer);

describe("Check-In Tool copy", () => {
  test("all standard radio options have copy", () => {
    expect(englishCopy.checkIn.standardRadioAnswers).toContainKeys(
      checkInStandardRadioAnswers,
    );
  });

  test("all multiple-choice questions' answers have copy", () => {
    const questions = Object.entries(checkInQuestionConfig) as [
      CheckInQuestionId,
      CheckInQuestionConfig,
    ][];

    questions.forEach(([id, config]) => {
      if ("answers" in config) {
        const hasAllStandardAnswers = config.answers.every(
          isCheckInStandardRadioAnswer,
        );

        if (!hasAllStandardAnswers) {
          expect(englishCopy.checkIn.questions[id]).toContainKey("answers");

          expect({
            // @ts-expect-error the existence of this object is enforced by the above expect
            ...englishCopy.checkIn.questions[id].answers,
            ...englishCopy.checkIn.standardRadioAnswers,
          }).toContainKeys(config.answers);
        }
      }
    });
  });
});
