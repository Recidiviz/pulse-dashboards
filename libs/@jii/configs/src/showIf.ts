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

export type ShowIfOperator = "equals" | "notEquals";

/**
 * A single condition: the item identified by `questionId` was answered in a way
 * that satisfies `operator` against `value` (e.g. "equals" "YES", or "notEquals"
 * "YES").
 */
export type ShowIfCondition<QuestionId extends string = string> = {
  questionId: QuestionId;
  operator: ShowIfOperator;
  value: string;
};

/**
 * Controls whether an item (a questionnaire question, a checklist item, etc.) is
 * shown, based on how some other item was answered: a single condition, or an
 * `any` list (shown if at least one condition matches, i.e. OR).
 * Add an `all` variant here if a future question requires it.
 */
export type ShowIf<QuestionId extends string = string> =
  | ShowIfCondition<QuestionId>
  | { any: ShowIfCondition<QuestionId>[] };

/**
 * Normalizes a ShowIf value to a flat list of its conditions: a single
 * condition becomes a one-element list, and an `any` list is returned as-is.
 * An absent showIf (nothing to check, i.e. always shown) returns [].
 */
export function conditionsOf<QuestionId extends string = string>(
  showIf: ShowIf<QuestionId> | undefined,
): ShowIfCondition<QuestionId>[] {
  if (!showIf) return [];
  return "any" in showIf ? showIf.any : [showIf];
}
