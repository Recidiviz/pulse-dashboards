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

import { makeAutoObservable } from "mobx";

import { RNAQuestionId } from "../components/UsNcRNA/usNcRNAFormSpec";

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
