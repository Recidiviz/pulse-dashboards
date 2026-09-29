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

import { SUCCESS_PLANNER_SECTIONS } from "../config/successPlannerSections";
import {
  SuccessPlanner,
  SuccessPlannerAnswers,
  SuccessPlannerSection,
  SuccessPlannerStatus,
} from "../model/successPlanner";

export function isSectionComplete(
  section: SuccessPlannerSection,
  answers: SuccessPlannerAnswers,
) {
  return section.questions.every((question) => question.id in answers);
}

export function getCompletedSectionCount(answers: SuccessPlannerAnswers) {
  return SUCCESS_PLANNER_SECTIONS.filter((section) =>
    isSectionComplete(section, answers),
  ).length;
}

export function getSuccessPlannerStatus(
  planner: SuccessPlanner,
): SuccessPlannerStatus {
  if (planner.completedAt) return "COMPLETED";
  return Object.keys(planner.answers).length === 0
    ? "NOT_STARTED"
    : "IN_PROGRESS";
}

export type SuccessPlannerProgress = {
  status: SuccessPlannerStatus;
  completedSectionCount: number;
  totalSectionCount: number;
};

export function getSuccessPlannerProgress(
  planner: SuccessPlanner,
): SuccessPlannerProgress {
  return {
    status: getSuccessPlannerStatus(planner),
    completedSectionCount: getCompletedSectionCount(planner.answers),
    totalSectionCount: SUCCESS_PLANNER_SECTIONS.length,
  };
}
