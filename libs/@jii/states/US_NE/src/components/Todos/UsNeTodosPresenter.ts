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

import { differenceInMonths } from "date-fns";
import { makeAutoObservable } from "mobx";

import { IntakeAssessmentPresenter } from "~@jii/case-planning";
import { OpportunityData, ResidentFlags, UserStore } from "~@jii/data";
import { UsNeTranslationsObject } from "~@jii/translation";
import { ResidentRecord, UsNeGoodTimeRestorationRecord } from "~datatypes";
import { FirebaseAuthClient } from "~firebase-auth";
import { Hydratable, HydrationState } from "~hydration-utils";

type GoodTimeOpportunity = OpportunityData & {
  opportunityRecord: UsNeGoodTimeRestorationRecord["output"];
};

export class UsNeTodosPresenter implements Hydratable {
  readonly intakeAssessmentPresenter: IntakeAssessmentPresenter;

  constructor(
    private readonly resident: ResidentRecord,
    private readonly opportunities: OpportunityData[],
    private readonly residentFlags: ResidentFlags,
    firebaseAuthClient: FirebaseAuthClient,
    userStore: UserStore,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.intakeAssessmentPresenter = new IntakeAssessmentPresenter(
      firebaseAuthClient,
      userStore,
      resident,
    );
  }

  get residentMetadata() {
    const { metadata } = this.resident;

    if (metadata.stateCode !== "US_NE") {
      throw new Error(
        `Unexpected state code for UsNeTodosPresenter ${metadata.stateCode}`,
      );
    }

    return metadata;
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
      this.shouldShowReentryAssessment
    );
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

  get goodTimeRestorationOpportunityRecord():
    | GoodTimeOpportunity["opportunityRecord"]
    | undefined {
    return this.opportunities.find(
      // This type guard only asserts what OpportunityData guarantees (that opportunityRecord's
      // type matches the opportunityId) but TypeScript is unable to deduce on its own.
      (opp): opp is GoodTimeOpportunity =>
        opp.opportunityId === "usNeGoodTimeRestoration",
    )?.opportunityRecord;
  }

  /**
   * Which Good Time Restoration todo should be shown, if any?
   */
  get goodTimeRestorationStatus():
    | keyof UsNeTranslationsObject["home"]["todos"]["goodTimeRestoration"]
    | undefined {
    const { goodTimeRestorationOpportunityRecord } = this;
    if (!goodTimeRestorationOpportunityRecord) {
      return;
    }

    const {
      ineligibleCriteria,
      metadata: { almostEligibleForJiiApp },
    } = goodTimeRestorationOpportunityRecord;

    // We're not showing the eligible states for now, just almost/ineligible
    if (!almostEligibleForJiiApp) return;

    if ("usNeNotInLtrhFor90Days" in ineligibleCriteria) return "ineligibleLTRH";
    if ("usNeNoOngoingClinicalTreatmentProgramRefusal" in ineligibleCriteria)
      return "ineligibleTreatment";
    return "almostEligible";
  }

  // Only used/well defined when goodTimeRestorationStatus === "almostEligible"
  get goodTimeRestorationMonthsRemaining(): number | undefined {
    const ineligibleCriteria =
      this.goodTimeRestorationOpportunityRecord?.ineligibleCriteria;
    if (!ineligibleCriteria) {
      return;
    }

    // At most one of these will exist in records marked as almostEligibleForJiiApp
    const latestEligibleDate =
      ineligibleCriteria.usNeLessThan3UdcMrsInPast6Months?.latestEligibleDate ??
      ineligibleCriteria.usNeNoIdcMrsInPast6Months?.latestEligibleDate ??
      ineligibleCriteria.usNeNoClass1MrsInLastYear?.latestEligibleDate;

    if (!latestEligibleDate) return;
    return Math.max(1, differenceInMonths(latestEligibleDate, new Date()));
  }

  get shouldShowReentryAssessment(): boolean {
    // If the intake presenter successfully hydrated and an auth token exists, then an assessment is available.
    return this.intakeAssessmentPresenter.isAuthorized;
  }
}
