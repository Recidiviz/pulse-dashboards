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

import { getVisibleQuestions } from "~@jii/configs";

import { SUCCESS_PLANNER_SECTIONS } from "../config/successPlannerSections";
import {
  SuccessPlanner,
  SuccessPlannerSection,
  SuccessPlannerStatus,
} from "../model/successPlanner";

export function getSections({ version }: SuccessPlanner) {
  return SUCCESS_PLANNER_SECTIONS[version];
}

export function isSectionComplete(
  section: SuccessPlannerSection,
  planner: SuccessPlanner,
) {
  const visibleQuestions = getVisibleQuestions(planner).map(
    ({ questionId }) => questionId,
  );

  return section.questions.every(
    (question) =>
      question.id in planner.answers || !visibleQuestions.includes(question.id),
  );
}

export function getCompletedSectionCount(planner: SuccessPlanner) {
  return getSections(planner).filter((section) =>
    isSectionComplete(section, planner),
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
    completedSectionCount: getCompletedSectionCount(planner),
    totalSectionCount: getSections(planner).length,
  };
}
