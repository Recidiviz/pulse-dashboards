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
import { NavigateFunction } from "react-router-dom";

import { fullRNASpec, RNAQuestionId } from "~@jii/configs";
import { RouteParams, State } from "~@jii/paths";

import { UsNcRNAForm } from "../../models/UsNcRNAForm";

export class UsNcRNAFormPagePresenter {
  // Only flag invalid answers once the user has tried to move forward on the page
  shouldShowInvalidAnswers = false;

  isUnsavedChangesModalOpen = false;
  isConfirmSubmissionModalOpen = false;

  // Set to true during database writes
  isSaving = false;
  savingError: string | undefined;

  // Links forward and back within the form
  previousPageLink: string;
  nextPageLink: string;

  // Extracted from the route parameters, for convenience.
  pageNum: number;

  constructor(
    readonly routeParams: RouteParams<typeof State.Resident.UsNcRNA.FormPage>,
    public form: UsNcRNAForm,
    private navigate: NavigateFunction,
  ) {
    this.pageNum = routeParams.pageNum;

    this.previousPageLink = State.Resident.UsNcRNA.FormPage.buildPath({
      ...routeParams,
      pageNum: routeParams.pageNum - 1,
    });
    this.nextPageLink = State.Resident.UsNcRNA.FormPage.buildPath({
      ...routeParams,
      pageNum: routeParams.pageNum - 1,
    });
    makeAutoObservable(this, {}, { autoBind: true });
  }

  /**
   * Write current state of answers to the database. Return whether the operation succeeded
   * or not.
   */
  *saveAnswers(completed = false) {
    if (!this.isSaving) {
      this.isSaving = true;
      try {
        yield this.form.saveAnswers({ completed });
        this.savingError = undefined;
      } catch (e) {
        captureException(e);
        this.savingError = e instanceof Error ? e.message : "Unknown error";
      }
      this.isSaving = false;
    }
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

  // Methods relating to the navigation buttons at the bottom of the page

  // Whether to show the submit button. If false, shows a button to navigate to
  // the next page instead.
  get showSubmit(): boolean {
    return this.pageIndex === fullRNASpec.length - 1;
  }

  get showPrevious(): boolean {
    return this.pageNum > 1;
  }

  /**
   * Returns true when either there are invalid answers or the user has entered
   * answers for free-text questions, which we can't save across page loads.
   */
  get shouldPreventSavingOnPreviousNavigation(): boolean {
    return this.hasAnyInvalidAnswer || this.form.hasDirtyLifeAreaQuestions;
  }

  *onPreviousPageButtonClick() {
    // If the form has been changed, either save answers silently if they're valid,
    // or alert the user that their answers can't be saved if not
    if (this.form.isDirty) {
      if (this.shouldPreventSavingOnPreviousNavigation) {
        this.openUnsavedChangesModal();
      } else {
        yield this.saveAnswers();
      }
    }

    // Regardless of whether we tried to save answers above,
    // we can navigate backward as long as we aren't waiting for user confirmation
    // and there wasn't an error
    if (!this.isUnsavedChangesModalOpen && !this.savingError) {
      this.navigateBack();
    }
  }

  *onNextPageButtonClick() {
    if (this.hasAnyInvalidAnswer) {
      this.displayInvalidAnswers();
    } else {
      yield this.saveAnswers();

      if (!this.savingError) {
        this.navigate(this.nextPageLink);
      }
    }
  }

  onSubmitButtonClick() {
    if (this.hasAnyInvalidAnswer) {
      this.displayInvalidAnswers();
    } else {
      this.openConfirmSubmissionModal();
    }
  }

  *onConfirmSubmission() {
    yield this.saveAnswers(true);

    if (!this.savingError) {
      this.navigate(State.Resident.UsNcRNA.Landing.buildPath(this.routeParams));
    } else {
      this.closeConfirmSubmissionModal();
    }
  }

  navigateBack() {
    this.navigate(this.previousPageLink);
  }

  openUnsavedChangesModal() {
    this.isUnsavedChangesModalOpen = true;
  }

  closeUnsavedChangesModal() {
    this.isUnsavedChangesModalOpen = false;
  }

  openConfirmSubmissionModal() {
    this.isConfirmSubmissionModalOpen = true;
  }

  closeConfirmSubmissionModal() {
    this.isConfirmSubmissionModalOpen = false;
  }
}
