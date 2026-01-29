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
import { merge } from "lodash";
import { makeAutoObservable } from "mobx";

import {
  fullRNASpec,
  RNAQuestionConfig,
  rnaQuestionConfig,
  RNAQuestionId,
} from "~@jii/configs";
import {
  LifeAreaAnswer,
  RNACheckboxAnswers,
  RNALifeAreaAnswers,
  RNATextAnswers,
} from "~@jii/configs";
import { DataAPI } from "~@jii/data";

/**
 * A particular resident's Risks and Needs Assessment form
 */
export class UsNcRNAForm {
  // User's answers that have been changed during the lifespan of this form object,
  // keyed by question id
  private textAnswers: Partial<RNATextAnswers> = {};
  private checkboxAnswers: Partial<RNACheckboxAnswers> = {};
  private lifeAreaAnswers: Partial<RNALifeAreaAnswers> = {};

  constructor(
    readonly apiClient: DataAPI,
    readonly id: string,

    // All of the user's saved answers, read from the database
    readonly savedTextAnswers: RNATextAnswers,
    readonly savedCheckboxAnswers: RNACheckboxAnswers,
    readonly savedLifeAreaAnswers: RNALifeAreaAnswers,
  ) {
    makeAutoObservable(this);
  }

  /**
   * Return the highest-numbered page of the form that has not yet been completed.
   * Since pages are 1-indexed, the return value is also 1-indexed.
   */
  get pageToResumeAt(): number {
    for (const [i, page] of fullRNASpec.entries()) {
      if (page.questions.some((id) => !this.hasValidAnswer(id))) {
        return i + 1;
      }
    }
    return fullRNASpec.length;
  }

  /**
   * Return true when the form has been edited.
   */
  get isDirty(): boolean {
    return (
      Object.keys(this.textAnswers).length +
        Object.keys(this.checkboxAnswers).length +
        Object.keys(this.lifeAreaAnswers).length >
      0
    );
  }

  get hasDirtyLifeAreaQuestions(): boolean {
    return Object.keys(this.lifeAreaAnswers).length > 0;
  }

  /**
   * Methods representing the current state of this form,
   * incorporating both answers saved to the database and answers that the user has changed.
   */
  get liveTextAnswers(): RNATextAnswers {
    return {
      ...this.savedTextAnswers,
      ...this.textAnswers,
    };
  }
  get liveCheckboxAnswers(): RNACheckboxAnswers {
    return merge(this.savedCheckboxAnswers, this.checkboxAnswers);
  }
  get liveLifeAreaAnswers(): RNALifeAreaAnswers {
    return merge(this.savedLifeAreaAnswers, this.lifeAreaAnswers);
  }
  private get liveAnswers() {
    return {
      ...this.liveTextAnswers,
      ...this.liveCheckboxAnswers,
      ...this.liveLifeAreaAnswers,
    };
  }

  /**
   * Return true when the given question has a "valid" answer.
   * The definition of "valid" depends on the question type.
   */
  hasValidAnswer(questionId: RNAQuestionId): boolean {
    const { optional, format } = rnaQuestionConfig[
      questionId
    ] as RNAQuestionConfig;

    // Optional questions with simple answer formats never have invalid answers
    if (optional && format !== "LIFE_AREA") {
      return true;
    }

    switch (format) {
      // Number of days per week must be 0-7
      case "DAYS_PER_WEEK_ENTRY": {
        const inputStr = this.liveTextAnswers[questionId];
        if (inputStr === "") return false;
        const input = Number(inputStr);
        return Number.isInteger(input) && 0 <= input && input <= 7;
      }
      // Other radio or text questions are valid if any answer is selected
      case "FREQUENCY":
      case "RATIO":
      case "YES_NO":
      case "DAYS_PER_WEEK_RADIO": {
        return Boolean(this.liveTextAnswers[questionId]);
      }
      // Checkbox questions must have at least one answer selected
      case "SOBRIETY": {
        if (!this.liveCheckboxAnswers[questionId]) {
          return false;
        }
        return Boolean(
          Object.values(this.liveCheckboxAnswers[questionId]).find(Boolean),
        );
      }
      // Life Area questions can be answered in three ways:
      case "LIFE_AREA": {
        const lifeAreaAnswer = this.liveLifeAreaAnswers[questionId];
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
    if (!this.liveLifeAreaAnswers[questionId]) {
      return false;
    }

    // The user has answered the question with "no"
    if (
      !this.liveLifeAreaAnswers[questionId].interest &&
      !this.liveLifeAreaAnswers[questionId].customLifeArea
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

  /**
   * Write current state of answers to the database.
   */
  *saveAnswers() {
    yield this.apiClient.trpc.state.usNc.updateRNA.mutate({
      id: this.id,
      answers: this.liveAnswers,
    });
    // Reset the form state after saving answers.
    // This is technically not needed because after every successful answer save,
    // we'll navigate to a different page and load the answers from the database again.
    this.textAnswers = {};
    this.checkboxAnswers = {};
    this.lifeAreaAnswers = {};
  }
}
