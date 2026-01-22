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

import assertNever from "assert-never";
import { makeAutoObservable } from "mobx";

import {
  rnaQuestionConfig,
  RNAQuestionId,
} from "../components/UsNcRNA/usNcRNAFormSpec";

export type LifeAreaAnswer = Partial<{
  interest: boolean;
  customLifeArea: string;
  interestRating: string;
  improvementText: string;
}>;

/**
 * A particular resident's Risks and Needs Assessment form
 */
export class UsNcRNAForm {
  // User's answers that have been changed during the lifespan of this form object,
  // keyed by question id
  readonly textAnswers: Partial<Record<RNAQuestionId, string>> = {};
  readonly checkboxAnswers: Partial<
    Record<RNAQuestionId, Record<string, boolean>>
  > = {};
  readonly lifeAreaAnswers: Partial<Record<RNAQuestionId, LifeAreaAnswer>> = {};

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Return true when the given question has a "valid" answer.
   * The definition of "valid" depends on the question type.
   * The return value is only meaningful for questions on the current page.
   */
  hasValidAnswer(questionId: RNAQuestionId): boolean {
    const { optional, format } = rnaQuestionConfig[questionId];

    // Optional questions with simple answer formats never have invalid answers
    if (optional && format !== "LIFE_AREA") {
      return true;
    }

    switch (format) {
      // Number of days per week must be 0-7
      case "DAYS_PER_WEEK_ENTRY": {
        const input = Number(this.textAnswers[questionId]);
        return Number.isInteger(input) && 0 <= input && input <= 7;
      }
      // Other radio or text questions are valid if any answer is selected
      case "FREQUENCY":
      case "RATIO":
      case "YES_NO":
      case "DAYS_PER_WEEK_RADIO": {
        return Boolean(this.textAnswers[questionId]);
      }
      // Checkbox questions must have at least one answer selected
      case "SOBRIETY": {
        if (!this.checkboxAnswers[questionId]) {
          return false;
        }
        return Boolean(
          Object.values(this.checkboxAnswers[questionId]).find(Boolean),
        );
      }
      // Life Area questions can be answered in three ways:
      case "LIFE_AREA": {
        const lifeAreaAnswer = this.lifeAreaAnswers[questionId];
        // 1) with "no"
        if (lifeAreaAnswer?.interest === false) {
          return true;
        }
        // 2) with "yes" or custom text, and the rating follow-up also answered
        if (lifeAreaAnswer?.interest || lifeAreaAnswer?.customLifeArea) {
          return Boolean(lifeAreaAnswer.interestRating);
        }
        // 3) by being optional
        // (this case is last on purpose: if an optional question has been answered,
        // the rating follow-up is mandatory)
        if (optional) {
          return true;
        }

        return false;
      }
      default:
        assertNever(format);
    }
  }

  /**
   * Return true when follow-up questions should be shown for the life areas
   * question with given id. If false, follow-up answers won't be saved/submitted.
   *
   * Assumes that the provided ID is a life areas question ID.
   */
  shouldShowLifeAreaFollowups(questionId: RNAQuestionId): boolean {
    // The user hasn't answered the question, or it isn't a life areas question
    if (!this.lifeAreaAnswers[questionId]) {
      return false;
    }

    // The user has answered the question with "no"
    if (
      !this.lifeAreaAnswers[questionId].interest &&
      !this.lifeAreaAnswers[questionId].customLifeArea
    ) {
      return false;
    }

    return true;
  }

  handleTextAnswerChange(questionId: RNAQuestionId, answer: string) {
    this.textAnswers[questionId] = answer;
  }

  handleCheckboxAnswerChange(
    questionId: RNAQuestionId,
    answer: string,
    checked: boolean,
  ) {
    this.checkboxAnswers[questionId] = {
      ...(this.checkboxAnswers[questionId] ?? {}),
      [answer]: checked,
    };
  }

  handleLifeAreaAnswerChange(
    questionId: RNAQuestionId,
    answer: LifeAreaAnswer,
  ) {
    this.lifeAreaAnswers[questionId] = {
      ...(this.lifeAreaAnswers[questionId] ?? {}),
      ...answer,
    };
  }
}
