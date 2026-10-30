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
  conditionIsMet,
  conditionsOf,
  reentryChecklistConfig,
  type ReentryChecklistItemId,
  reentryChecklistItemIds,
  reentryChecklistSectionIds,
  type ReentryQuestionnaireAnswers,
  type ReentryQuestionnaireQuestionFormat,
} from "~@jii/configs";
import type { QuestionnaireExitScreen } from "~@jii/data";

import {
  FlowStep,
  QuestionAnswerValue,
  QuestionDisplay,
  QuestionnaireQuestion,
} from "../components/Reentry/Questionnaire/types";
import {
  formatAnswerText,
  fromStoredAnswers,
} from "../components/Reentry/Questionnaire/utils";
import { ReentryQuestionnaireStatus } from "../components/Reentry/types";
import {
  PersonalizationReason,
  ReentryChecklistChange,
  ReentryChecklistItem,
  ReentryChecklistSection,
} from "./types";

/**
 * Returns the resident's checklist items, in the order the config lists them.
 * Items with a showIf condition are marked as personalized.
 *
 * Each item shows its saved value, unless a change to it is still being saved.
 * pendingChanges are in the order the resident made them, so the latest
 * change to an item wins. Items in failedItemIds are marked as having a save
 * error.
 */
export function toChecklistItems(
  savedItems: { itemId: string; checked: boolean }[],
  pendingChanges: ReentryChecklistChange[],
  failedItemIds: ReentryChecklistItemId[],
): ReentryChecklistItem[] {
  const checkedById = new Map(
    savedItems.map((item) => [item.itemId, item.checked]),
  );

  // Pending changes take priority over saved values.
  for (const change of pendingChanges) {
    checkedById.set(change.itemId, change.checked);
  }

  return reentryChecklistItemIds.flatMap((id) => {
    const checked = checkedById.get(id);
    if (checked === undefined) return [];
    return [
      {
        id,
        checked,
        isPersonalized: reentryChecklistConfig[id].showIf !== undefined,
        hasSaveError: failedItemIds.includes(id),
      },
    ];
  });
}

/**
 * Groups the resident's checklist items into the sections the checklist page
 * shows, in order. Items keep their order within a section. Sections with no
 * items are left out.
 */
export function toChecklistSections(
  items: ReentryChecklistItem[],
): ReentryChecklistSection[] {
  const sections = reentryChecklistSectionIds.map((id) => ({
    id,
    items: items.filter(
      (item) => reentryChecklistConfig[item.id].section === id,
    ),
  }));

  return sections.filter((section) => section.items.length > 0);
}

/**
 * Returns the resident's answers that put a checklist item on their list: one
 * entry for each question whose answer meets one of the item's showIf
 * conditions, in questionnaire order. An item with no showIf returns [].
 */
export function getPersonalizationReasons(
  itemId: ReentryChecklistItemId,
  questions: QuestionDisplay[],
  storedAnswers: ReentryQuestionnaireAnswers,
): PersonalizationReason[] {
  const matchedConditions = conditionsOf(
    reentryChecklistConfig[itemId].showIf,
  ).filter((condition) => conditionIsMet(condition, storedAnswers));
  const matchedQuestionIds = new Set<string>(
    matchedConditions.map((condition) => condition.questionId),
  );
  const answers = fromStoredAnswers(questions, storedAnswers);

  return questions
    .filter((question) => matchedQuestionIds.has(question.id))
    .map((question) => ({
      questionId: question.id,
      heading: question.heading,
      answerText: formatAnswerText(question, answers[question.id]),
    }));
}

/**
 * Derives the resident's questionnaire status from their latest Reentry
 * Questionnaire record. `null` (no record found) and a record with no answers
 * yet are both "NOT_STARTED".
 */
export function getQuestionnaireStatus(
  questionnaire: {
    completedAt: Date | null;
    answers: Record<string, unknown>;
  } | null,
): ReentryQuestionnaireStatus {
  if (!questionnaire || Object.keys(questionnaire.answers).length === 0)
    return "NOT_STARTED";
  return questionnaire.completedAt ? "COMPLETED" : "IN_PROGRESS";
}

/**
 * Returns the answers in the shape they're stored in: a single string for RADIO
 * questions and a list for CHECKBOX ones, leaving out unanswered questions.
 */
export function toStoredAnswers(
  questions: { id: string; format: ReentryQuestionnaireQuestionFormat }[],
  answers: Record<string, string[]>,
): Record<string, string | string[]> {
  const storedAnswers: Record<string, string | string[]> = {};

  for (const question of questions) {
    const value = answers[question.id];
    if (value?.length) {
      storedAnswers[question.id] =
        question.format === "RADIO" ? value[0] : value;
    }
  }

  return storedAnswers;
}

/** Analytics Helpers */

const RATHER_NOT_SAY_OPTION = "DECLINED_TO_ANSWER";

/**
 * Returns whether the answer is "I'd rather not say".
 */
export function isRatherNotSay(
  value: QuestionAnswerValue | undefined,
): boolean {
  return !!value?.includes(RATHER_NOT_SAY_OPTION);
}

/**
 * Returns the screen questionnaire_exited reports for the current step.
 */
export function getExitScreen(
  step: FlowStep,
  isProfileCompleted: boolean,
): QuestionnaireExitScreen {
  if (step.kind !== "review") return step.kind;
  return isProfileCompleted ? "review_profile" : "review_before_submit";
}

/**
 * Returns the question_viewed properties for a question: where it falls among
 * the visible questions, counting from 1.
 */
export function getQuestionViewed(
  visibleQuestions: QuestionnaireQuestion[],
  questionId: string,
  isEditingProfile: boolean,
) {
  const index = visibleQuestions.findIndex(({ id }) => id === questionId);
  return {
    questionId,
    sectionId: visibleQuestions[index].sectionDomain,
    stepIndex: index + 1,
    stepTotal: visibleQuestions.length,
    isEditingProfile,
  };
}
