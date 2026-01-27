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

import { captureException } from "@sentry/react";
import { makeAutoObservable } from "mobx";

import { fullRNASpec, RNAQuestionId } from "~@jii/configs";

import { UsNcRNAForm } from "../../models/UsNcRNAForm";

export class UsNcRNAFormPagePresenter {
  // Only flag invalid answers once the user has tried to move forward on the page
  shouldShowInvalidAnswers = false;

  // Set to true during database writes
  isSaving = false;
  savingError: string | undefined;

  constructor(
    readonly pageNum: number,
    public form: UsNcRNAForm,
  ) {
    makeAutoObservable(this);
  }

  /**
   * Write current state of answers to the database. Return whether the operation succeeded
   * or not.
   */
  *saveAnswers() {
    this.isSaving = true;
    try {
      yield this.form.saveAnswers();
      this.savingError = undefined;
    } catch (e) {
      captureException(e);
      this.savingError = e instanceof Error ? e.message : "Unknown error";
    }
    this.isSaving = false;
  }

  // Methods related to the display of the form page itself

  get isValidPage(): boolean {
    return (
      Number.isInteger(this.pageIndex) &&
      this.pageIndex >= 0 &&
      this.pageIndex < fullRNASpec.length
    );
  }

  // Convenience method since page numbers are 1-indexed
  get pageIndex() {
    return this.pageNum - 1;
  }

  get pageId() {
    return fullRNASpec[this.pageIndex].id;
  }

  get showSubmit(): boolean {
    return this.pageIndex === fullRNASpec.length - 1;
  }

  get questionIds(): RNAQuestionId[] {
    return fullRNASpec[this.pageIndex].questions;
  }

  /**
   * Whether to display invalid answer information for a particular question.
   */
  isVisiblyInvalid(questionId: RNAQuestionId): boolean {
    return (
      this.shouldShowInvalidAnswers && !this.form.hasValidAnswer(questionId)
    );
  }

  displayInvalidAnswers(): void {
    this.shouldShowInvalidAnswers = true;
  }

  /**
   * Returns true when any answer on the current form page is invalid.
   */
  get hasAnyInvalidAnswer(): boolean {
    return Boolean(
      this.questionIds.find((id) => !this.form.hasValidAnswer(id)),
    );
  }
}
