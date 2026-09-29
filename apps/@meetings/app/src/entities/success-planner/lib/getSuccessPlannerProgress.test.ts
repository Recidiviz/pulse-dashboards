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
  COMPLETED_PLANNER,
  IN_PROGRESS_PLANNER,
  NOT_STARTED_PLANNER,
} from "../api/mockSuccessPlanner";
import { SUCCESS_PLANNER_SECTIONS } from "../config/successPlannerSections";
import { getAnswerState } from "../model/successPlanner";
import {
  getCompletedSectionCount,
  getSuccessPlannerProgress,
  getSuccessPlannerStatus,
  isSectionComplete,
} from "./getSuccessPlannerProgress";

const HOUSING = SUCCESS_PLANNER_SECTIONS[0];

describe("getSuccessPlannerStatus", () => {
  test("no answers is NOT_STARTED", () => {
    expect(getSuccessPlannerStatus(NOT_STARTED_PLANNER)).toBe("NOT_STARTED");
  });

  test("some answers and no completedAt is IN_PROGRESS", () => {
    expect(getSuccessPlannerStatus(IN_PROGRESS_PLANNER)).toBe("IN_PROGRESS");
  });

  test("completedAt wins over the answers", () => {
    expect(
      getSuccessPlannerStatus({
        ...NOT_STARTED_PLANNER,
        completedAt: new Date(),
      }),
    ).toBe("COMPLETED");
  });
});

describe("isSectionComplete", () => {
  test("is false while any question is unreached", () => {
    const partial = { "housing-where": "Staying with family or friends" };
    expect(isSectionComplete(HOUSING, partial)).toBe(false);
  });

  test("counts a deliberately skipped question as reached", () => {
    const skippedThroughout = Object.fromEntries(
      HOUSING.questions.map((question) => [question.id, null]),
    );
    expect(isSectionComplete(HOUSING, skippedThroughout)).toBe(true);
  });
});

describe("getCompletedSectionCount", () => {
  test("counts the sections the in-progress fixture covers", () => {
    expect(getCompletedSectionCount(IN_PROGRESS_PLANNER.answers)).toBe(3);
  });

  test("counts every section once the planner is done", () => {
    expect(getCompletedSectionCount(COMPLETED_PLANNER.answers)).toBe(
      SUCCESS_PLANNER_SECTIONS.length,
    );
  });
});

describe("getSuccessPlannerProgress", () => {
  test("reports the fraction the card renders", () => {
    expect(getSuccessPlannerProgress(IN_PROGRESS_PLANNER)).toEqual({
      status: "IN_PROGRESS",
      completedSectionCount: 3,
      totalSectionCount: 10,
    });
  });
});

describe("getAnswerState", () => {
  const answers = { answered: "Yes", skipped: null };

  test("separates an absent question from an explicitly blank one", () => {
    expect(getAnswerState(answers, "answered")).toBe("answered");
    expect(getAnswerState(answers, "skipped")).toBe("skipped");
    expect(getAnswerState(answers, "never-reached")).toBe("unreached");
  });
});
