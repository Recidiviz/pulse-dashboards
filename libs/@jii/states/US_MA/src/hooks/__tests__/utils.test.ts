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
  getAnswer,
  getQuestionnaireStatus,
  getQuestionOptions,
  getVisibleQuestions,
} from "../utils";

describe("getQuestionnaireStatus", () => {
  test("returns NOT_STARTED when there is no record", () => {
    expect(getQuestionnaireStatus(null)).toBe("NOT_STARTED");
  });

  test("returns NOT_STARTED when the record has no answers yet", () => {
    expect(getQuestionnaireStatus({ completedAt: null, answers: {} })).toBe(
      "NOT_STARTED",
    );
  });

  test("returns IN_PROGRESS when there are answers but no completedAt", () => {
    expect(
      getQuestionnaireStatus({
        completedAt: null,
        answers: { housing: "OWN_PLACE" },
      }),
    ).toBe("IN_PROGRESS");
  });

  test("returns COMPLETED when completedAt is set", () => {
    expect(
      getQuestionnaireStatus({
        completedAt: new Date(),
        answers: { housing: "OWN_PLACE" },
      }),
    ).toBe("COMPLETED");
  });
});

// TODO OBT-51840: these document the current placeholder behavior - update
// once the real questionnaire config and showIf evaluator exist.
describe("getVisibleQuestions (placeholder)", () => {
  test("returns an empty list regardless of answers", () => {
    expect(getVisibleQuestions({ housing: "OWN_PLACE" })).toEqual([]);
  });
});

describe("getAnswer (placeholder)", () => {
  test("reads the raw answer for a question id", () => {
    expect(getAnswer({ housing: "OWN_PLACE" }, "housing")).toBe("OWN_PLACE");
  });

  test("returns undefined for an unanswered question", () => {
    expect(getAnswer({}, "housing")).toBeUndefined();
  });
});

describe("getQuestionOptions (placeholder)", () => {
  test("returns an empty list regardless of question id", () => {
    expect(getQuestionOptions("housing")).toEqual([]);
  });
});
