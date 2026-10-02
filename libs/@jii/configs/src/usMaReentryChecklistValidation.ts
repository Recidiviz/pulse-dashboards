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

import { conditionsOf } from "./showIf";
import {
  reentryChecklistConfig,
  ReentryChecklistItemConfig,
  ReentryChecklistItemId,
} from "./usMaReentryChecklistSpec";
import { reentryQuestionnaireConfig } from "./usMaReentryQuestionnaireSpec";

/**
 * Checks that every `showIf` condition in the given checklist config refers to
 * a real option of the question it names in `reentryQuestionnaireConfig`
 * (`questionId` itself is already enforced at compile time by
 * `ShowIf<ReentryQuestionnaireQuestionId>`, but option values aren't part of
 * that type) — call this from a test to catch a typo'd option value.
 *
 * @returns a human-readable description of each problem found, or [] if none.
 */
export function findInvalidReentryChecklistShowIfConditions(
  checklistConfig: Partial<
    Record<ReentryChecklistItemId, ReentryChecklistItemConfig>
  > = reentryChecklistConfig,
): string[] {
  const problems: string[] = [];

  for (const itemId of Object.keys(
    checklistConfig,
  ) as ReentryChecklistItemId[]) {
    for (const condition of conditionsOf(checklistConfig[itemId]?.showIf)) {
      const question = reentryQuestionnaireConfig[condition.questionId];
      const validOptionIds: readonly string[] = question.options;

      if (!validOptionIds.includes(condition.value)) {
        problems.push(
          `${itemId}: showIf references option "${condition.value}" which is not ` +
            `a valid option of question "${condition.questionId}" (valid: ${validOptionIds.join(", ")})`,
        );
      }
    }
  }

  return problems;
}
