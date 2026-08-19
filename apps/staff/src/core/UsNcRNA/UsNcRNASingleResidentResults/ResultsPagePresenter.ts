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

import { TRPCClient } from "@trpc/client";
import { makeAutoObservable, runInAction } from "mobx";

import {
  allRNAQuestions,
  fullRNASpec,
  RNACheckboxAnswers,
  RNALifeAreaAnswers,
  RNAPageId,
  RNAQuestionId,
  RNATextAnswers,
} from "~@jii/configs";
import { JiiStaffAppRouter, JiiStaffAppRouterOutputs } from "~@jii/trpc-types";

import { formatWorkflowsDate } from "../../../utils";
import { Resident } from "../../../WorkflowsStore/Resident";
import { RNAStatus } from "../UsNcRNATable";

export class ResultsPagePresenter {
  constructor(
    public resident: Resident,
    private answerData: NonNullable<
      JiiStaffAppRouterOutputs["staff"]["usNc"]["getRNA"]
    >,
    private trpcClient: TRPCClient<JiiStaffAppRouter>,
  ) {
    makeAutoObservable<this, "trpcClient">(
      this,
      { trpcClient: false },
      { autoBind: true },
    );
  }

  // temporary view state to reflect clicks of the submitted/undo buttons;
  // the upstream queries will be refetched when a user navigates away from this
  // page so the other views will catch up to this state on their own
  private submittedDateOverride?: Date | null;

  get status(): RNAStatus {
    return this.submittedDateOverride
      ? "SUBMITTED_BY_STAFF"
      : this.answerData.status;
  }

  get textAnswers(): RNATextAnswers {
    return this.answerData.textAnswers;
  }

  get checkboxAnswers(): RNACheckboxAnswers {
    return this.answerData.checkboxAnswers;
  }

  get lifeAreaAnswers(): RNALifeAreaAnswers {
    return this.answerData.lifeAreaAnswers;
  }

  hasAnswer(id: RNAQuestionId): boolean {
    return Boolean(
      this.textAnswers[id] ||
        this.lifeAreaAnswers[id] ||
        this.checkboxAnswers[id],
    );
  }

  /**
   * Return a list of page sections to show on the results page.
   *
   * We only show a section for a form page if at least one question on the page was
   * answered. (In practice this is equivalent to all questions being answered.)
   */
  get pagesToDisplay(): RNAPageId[] {
    return fullRNASpec
      .filter(({ questions }) => {
        return questions.some(this.hasAnswer);
      })
      .map(({ id }) => id);
  }

  /**
   * The RNA questions this person has answered, in order.
   * Used to correctly calculate the question number when taking into account
   * deprecated questions.
   */
  get answeredRNAQuestions(): RNAQuestionId[] {
    return allRNAQuestions.filter(this.hasAnswer);
  }

  get formattedSubmissionDate() {
    const dateSubmitted =
      this.answerData.submittedByStaffAt ?? this.submittedDateOverride;

    return dateSubmitted ? formatWorkflowsDate(dateSubmitted) : undefined;
  }

  async markSubmitted() {
    const { submittedByStaffAt } =
      await this.trpcClient.staff.usNc.setRNASubmitted.mutate({
        id: this.answerData.id,
        isSubmitted: true,
      });
    runInAction(() => {
      this.submittedDateOverride = submittedByStaffAt;
    });
  }

  async clearSubmitted() {
    await this.trpcClient.staff.usNc.setRNASubmitted.mutate({
      id: this.answerData.id,
      isSubmitted: false,
    });
    runInAction(() => {
      this.submittedDateOverride = undefined;
    });
  }
}
