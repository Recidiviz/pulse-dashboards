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

import type {
  ReentryQuestionnaireQuestionConfig,
  ShowIf,
  ShowIfCondition,
} from "~@jii/configs";

import { ReentryQuestionnaireStatus } from "../types";
import {
  BuildQuestionnaireDisplayParams,
  FlowStep,
  GetOptionCopy,
  GetQuestionCopy,
  QuestionAnswerValue,
  QuestionDisplay,
  QuestionnaireAnswers,
  QuestionnaireDisplay,
  QuestionnaireQuestion,
} from "./types";

/**
 * Extracts the showIf conditions from a question's showIf property,
 * normalizing them into an array of ShowIfCondition objects.
 */
const getShowIfConditions = (showIf: ShowIf | undefined): ShowIfCondition[] => {
  if (!showIf) return [];
  return "any" in showIf ? showIf.any : [showIf];
};

/**
 * Determines if a question is visible based on its showIf conditions and the current answers.
 */
export function isQuestionVisible(
  question: QuestionDisplay,
  answers: QuestionnaireAnswers,
): boolean {
  if (!question.showIf) return true;
  return getShowIfConditions(question.showIf).some((condition) => {
    const answer = answers[condition.questionId];
    if (!answer?.length) return false;

    // Check if the current answer for this question matches the condition.
    const matches = answer.includes(condition.value);
    // Determine if the condition is met based on the operator.
    return condition.operator === "equals" ? matches : !matches;
  });
}

/**
 * Returns the subset of questions that are visible based on the current answers.
 */
export function getVisibleQuestions<T extends QuestionDisplay>(
  questions: T[],
  answers: QuestionnaireAnswers,
): T[] {
  return questions.filter((question) => isQuestionVisible(question, answers));
}

/**
 * Keeps answers only for questions that are visible based on the current answers.
 * If a changed answer hides a follow-up question, its answer is cleared.
 */
export function pruneHiddenAnswers(
  questions: QuestionDisplay[],
  answers: QuestionnaireAnswers,
): QuestionnaireAnswers {
  // Checks against the answers kept so far, so a hidden question's follow-ups are pruned too.
  return questions.reduce<QuestionnaireAnswers>((kept, question) => {
    const value = answers[question.id];
    if (value && isQuestionVisible(question, kept)) kept[question.id] = value;
    return kept;
  }, {});
}

/**
 * Determines if a question has been answered based on its value.
 */
export function isAnswered(value: QuestionAnswerValue | undefined): boolean {
  return !!value?.length;
}

/**
 * Determines if a question is a follow-up of any question in the given set of question IDs.
 */
export function isFollowUpOf(
  question: QuestionDisplay,
  questionIds: Set<string>,
): boolean {
  return getShowIfConditions(question.showIf).some((condition) =>
    questionIds.has(condition.questionId),
  );
}

/**
 * Returns the ids of the questions an edit from Review covers: the question
 * being edited, plus every question that depends on it, directly or through
 * another follow-up.
 */
export function getEditQuestionIds(
  questions: QuestionDisplay[],
  startQuestionId: string,
): Set<string> {
  const editQuestionIds = new Set([startQuestionId]);
  // Follow-ups come after the questions they depend on, so one pass in order
  // also picks up follow-ups of follow-ups.
  for (const question of questions) {
    if (isFollowUpOf(question, editQuestionIds)) {
      editQuestionIds.add(question.id);
    }
  }
  return editQuestionIds;
}

/**
 * Applies the logic for exclusive options in a question.
 * If the newly added value is exclusive, it clears all other selections.
 * If a non-exclusive value is added, it removes any previously selected exclusive values.
 */
export function applyExclusiveOptions(
  question: QuestionDisplay,
  current: QuestionAnswerValue | undefined,
  updated: QuestionAnswerValue,
): QuestionAnswerValue {
  const added = updated.find((value) => !current?.includes(value));
  if (!added) return updated;

  const isExclusive = (value: string) =>
    question.options.some(
      (option) => option.value === value && option.exclusive,
    );

  return isExclusive(added) ? [added] : updated.filter((v) => !isExclusive(v));
}

/**
 * Formats the answer text for a question based on its options.
 */
export function formatAnswerText(
  question: QuestionDisplay,
  value: QuestionAnswerValue | undefined,
): string {
  return (value ?? [])
    .map(
      (val) =>
        question.options.find((option) => option.value === val)?.label ?? val,
    )
    .join(", ");
}

/**
 * Returns the initial answers for all questions based on stored answers.
 */
export function getInitialAnswers(
  questions: QuestionnaireQuestion[],
  storedAnswers: Record<string, unknown>,
): QuestionnaireAnswers {
  return Object.fromEntries(
    questions.flatMap((question) => {
      const value = storedAnswers[question.id];
      // Stored RADIO answers are plain strings - FE wraps them in an array.
      if (typeof value === "string") return [[question.id, [value]]];
      if (Array.isArray(value)) return [[question.id, value]];
      return [];
    }),
  );
}

/**
 * Determines the initial step for the questionnaire based on its status, questions, and answers.
 *
 * "intro" if the questionnaire has not been started.
 * "review" if there are no unanswered visible questions.
 * "question" with the ID of the first unanswered visible question if the questionnaire is in progress.
 */
export function getInitialStep(
  status: ReentryQuestionnaireStatus,
  questions: QuestionnaireQuestion[],
  answers: QuestionnaireAnswers,
): FlowStep {
  if (status === "NOT_STARTED") return { kind: "intro" };
  if (status === "COMPLETED") return { kind: "review" };

  const firstUnansweredQuestion = getVisibleQuestions(questions, answers).find(
    (question) => !isAnswered(answers[question.id]),
  );
  return firstUnansweredQuestion
    ? { kind: "question", questionId: firstUnansweredQuestion.id }
    : { kind: "review" };
}

/**
 * Combines a question's config (ids and rules) with its copy into what the screens render.
 */
export function buildQuestionDisplay<QuestionId extends string>(
  questionId: QuestionId,
  config: ReentryQuestionnaireQuestionConfig,
  getQuestionCopy: GetQuestionCopy<QuestionId>,
  getOptionCopy: GetOptionCopy<QuestionId>,
): QuestionDisplay {
  const exclusiveOptions =
    config.format === "CHECKBOX" ? config.exclusiveOptions : [];

  return {
    id: questionId,
    format: config.format,
    heading: getQuestionCopy(questionId),
    options: config.options.map((optionId) => ({
      value: optionId,
      label: getOptionCopy(questionId, optionId),
      exclusive: exclusiveOptions.includes(optionId),
    })),
    showIf: config.showIf,
  };
}

/**
 * Builds the questions and sections the questionnaire displays, from its config and copy.
 * Questions come back in config order, each tagged with its section.
 */
export function buildQuestionnaireDisplay<QuestionId extends string>({
  questionIds,
  config,
  getSectionLabel,
  getQuestionCopy,
  getOptionCopy,
}: BuildQuestionnaireDisplayParams<QuestionId>): QuestionnaireDisplay {
  // Sections appear in the order of their first question.
  const sectionDomains = [
    ...new Set(questionIds.map((id) => config[id].domain)),
  ];

  return {
    sections: sectionDomains.map((domain) => ({
      domain,
      label: getSectionLabel(domain),
    })),
    questions: questionIds.map((id) => ({
      ...buildQuestionDisplay(id, config[id], getQuestionCopy, getOptionCopy),
      sectionDomain: config[id].domain,
    })),
  };
}
