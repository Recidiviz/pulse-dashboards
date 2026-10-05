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
  conditionsOf,
  reentryChecklistConfig,
  ReentryChecklistItemId,
  ReentryQuestionnaireAnswers,
  ShowIfCondition,
} from "~@jii/configs";

export function conditionIsMet(
  condition: ShowIfCondition<keyof ReentryQuestionnaireAnswers>,
  answers: ReentryQuestionnaireAnswers,
): boolean {
  const answer = answers[condition.questionId];
  if (answer === undefined) return false;

  // TODO(REE-176): Read the question's format from reentryQuestionnaireConfig
  // instead of inferring it from the answer's shape. The config can't be used
  // here until ~@jii/configs stops exporting the dummy spec under the same name.
  const isEqual = Array.isArray(answer)
    ? // CHECKBOX: "equals" means that option is checked
      answer.includes(condition.value)
    : answer === condition.value;

  return condition.operator === "equals" ? isEqual : !isEqual;
}

/**
 * Whether a single checklist item should be shown, given a resident's current
 * questionnaire answers. An item with no `showIf` is always applicable.
 */
export function isReentryChecklistItemApplicable(
  itemId: ReentryChecklistItemId,
  answers: ReentryQuestionnaireAnswers,
): boolean {
  const { showIf } = reentryChecklistConfig[itemId];
  if (!showIf) return true;

  return conditionsOf(showIf).some((condition) =>
    conditionIsMet(condition, answers),
  );
}

/**
 * All checklist item ids that are applicable given a resident's current
 * questionnaire answers.
 */
export function getApplicableReentryChecklistItems(
  answers: ReentryQuestionnaireAnswers,
): ReentryChecklistItemId[] {
  return (
    Object.keys(reentryChecklistConfig) as ReentryChecklistItemId[]
  ).filter((itemId) => isReentryChecklistItemApplicable(itemId, answers));
}
