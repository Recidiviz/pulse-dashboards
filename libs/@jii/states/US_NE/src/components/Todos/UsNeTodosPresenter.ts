// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { UseSuspenseQueryResult } from "@tanstack/react-query";
import { TRPCClientErrorLike } from "@trpc/client";
import { differenceInMonths } from "date-fns";
import { makeAutoObservable } from "mobx";

import { IntakeAssessmentPresenter } from "~@jii/case-planning";
import { ResidentRecord, UserStore } from "~@jii/data";
import { UsNeTranslationsObject } from "~@jii/translation";
import { JiiResidentAppRouter } from "~@jii/trpc-types";
import {
  usNeGoodTimeRestorationTodosCriterionEnum,
  UsNeResidentJiiData,
} from "~datatypes";
import { FirebaseAuthClient } from "~firebase-auth";
import { Hydratable, HydrationState } from "~hydration-utils";

import { CheckInFormResult } from "../CheckInTool/types";

export class UsNeTodosPresenter implements Hydratable {
  readonly intakeAssessmentPresenter: IntakeAssessmentPresenter;

  constructor(
    resident: ResidentRecord,
    private readonly residentMetadata: UsNeResidentJiiData,
    firebaseAuthClient: FirebaseAuthClient,
    userStore: UserStore,
    public checkInFormQuery: UseSuspenseQueryResult<
      CheckInFormResult,
      TRPCClientErrorLike<JiiResidentAppRouter>
    >,
    private readonly usNeCheckInTool: boolean,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.intakeAssessmentPresenter = new IntakeAssessmentPresenter(
      firebaseAuthClient,
      userStore,
      resident,
    );
  }

  async hydrate(): Promise<void> {
    await this.intakeAssessmentPresenter.hydrate();
  }

  get hydrationState(): HydrationState {
    return this.intakeAssessmentPresenter.hydrationState;
  }

  get shouldShowTodos(): boolean {
    return (
      this.shouldShowReentryChecklist ||
      !!this.goodTimeRestorationStatus ||
      this.shouldShowReentryAssessment ||
      this.shouldShowCheckInTodo
    );
  }

  get shouldShowCheckInTodo(): boolean {
    return Boolean(
      this.usNeCheckInTool &&
        this.checkInFormData &&
        !this.checkInFormData.completedAt,
    );
  }

  get checkInFormData() {
    return this.checkInFormQuery.data;
  }

  /**
   * Determines if the resident should see the reentry checklist.
   * Only show if the resident is not serving a life sentence or a sentence for more than 75 years.
   */
  get shouldShowReentryChecklist(): boolean {
    const years = this.residentMetadata.maximumSentenceYears;
    if (years === null) {
      return false;
    }
    return years <= 75;
  }

  /**
   * We expect and support at most one item in the array of todos
   */
  private get goodTimeRestorationTodo():
    | UsNeResidentJiiData["goodTimeRestorationTodos"][number]
    | undefined {
    const { goodTimeRestorationTodos } = this.residentMetadata;

    return goodTimeRestorationTodos.length > 0
      ? goodTimeRestorationTodos[0]
      : undefined;
  }

  /**
   * Which Good Time Restoration todo should be shown, if any?
   */
  get goodTimeRestorationStatus():
    | keyof UsNeTranslationsObject["home"]["todos"]["goodTimeRestoration"]
    | undefined {
    const restorationReason = this.goodTimeRestorationTodo;
    if (!restorationReason) return;

    switch (restorationReason.criterion) {
      case usNeGoodTimeRestorationTodosCriterionEnum.enum
        .US_NE_NOT_IN_LTRH_FOR_90_DAYS:
        return "ineligibleLTRH";
      case usNeGoodTimeRestorationTodosCriterionEnum.enum
        .US_NE_NO_ONGOING_CLINICAL_TREATMENT_PROGRAM_REFUSAL:
        return "ineligibleTreatment";
      default:
        return "almostEligible";
    }
  }

  // Only supported when goodTimeRestorationStatus === "almostEligible"
  get goodTimeRestorationMonthsRemaining(): number | undefined {
    if (this.goodTimeRestorationStatus !== "almostEligible") return;

    const latestEligibleDate =
      this.goodTimeRestorationTodo?.reason.latestEligibleDate;

    if (!latestEligibleDate) return;
    return Math.max(1, differenceInMonths(latestEligibleDate, new Date()));
  }

  get shouldShowReentryAssessment(): boolean {
    // If the intake presenter successfully hydrated and an auth token exists, then an assessment is available.
    return this.intakeAssessmentPresenter.isAuthorized;
  }
}
