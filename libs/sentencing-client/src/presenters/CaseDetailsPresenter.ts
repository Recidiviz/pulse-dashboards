// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { startCase, toLower } from "lodash";
import { flowResult, makeAutoObservable, when } from "mobx";

import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
  isHydrated,
} from "~hydration-utils";

import { Opportunities } from "../api";
import { CaseDetailsForm } from "../components/CaseDetails/Form/CaseDetailsForm";
import {
  FormAttributes,
  MutableCaseAttributes,
  OpportunitiesIdentifier,
  SelectedRecommendation,
} from "../components/CaseDetails/types";
import { CaseStore } from "../datastores/CaseStore";

export class CaseDetailsPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  private caseDetailsForm?: CaseDetailsForm;

  recommendedOpportunities: {
    opportunityName: string;
    providerPhoneNumber: string;
  }[];

  constructor(
    public readonly caseStore: CaseStore,
    public caseId: string,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.recommendedOpportunities = [];
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.caseStore.psiStore.staffStore.staffInfo === undefined)
            throw new Error("Failed to load staff details");
        },
        () => {
          if (this.caseStore.caseDetailsById[this.caseId] === undefined)
            throw new Error("Failed to load case details");
        },
      ],
      populate: async () => {
        if (!this.caseStore.psiStore.staffStore.staffInfo) {
          await flowResult(this.caseStore.psiStore.staffStore.loadStaffInfo());
        }
        await flowResult(this.caseStore.loadOffenses());
        await flowResult(this.caseStore.loadCaseDetails(this.caseId));
        await flowResult(this.caseStore.loadCommunityOpportunities());
      },
    });

    when(
      () => isHydrated(this),
      () => {
        this.caseDetailsForm = new CaseDetailsForm(
          this.caseAttributes,
          this.offenses,
        );
        this.recommendedOpportunities =
          this.caseAttributes.recommendedOpportunities ?? [];
      },
    );
  }

  get staffPseudoId() {
    return this.caseStore.psiStore.staffPseudoId;
  }

  get caseAttributes() {
    const currentCase = this.caseStore.caseDetailsById[this.caseId];
    if (currentCase.Client?.fullName) {
      currentCase.Client.fullName = startCase(
        toLower(currentCase.Client?.fullName),
      );
    }

    return currentCase;
  }

  get offenses() {
    return this.caseStore.offenses;
  }

  get communityOpportunities(): Opportunities {
    return this.caseStore.communityOpportunities;
  }

  get form() {
    return this.caseDetailsForm;
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  async updateAttributes(caseId: string, attributes?: MutableCaseAttributes) {
    if (!attributes && JSON.stringify(this.form?.transformedUpdates) === "{}")
      return;

    await flowResult(
      this.caseStore.updateCaseDetails(
        caseId,
        attributes ?? this.form?.transformedUpdates,
      ),
    );
    await flowResult(this.caseStore.loadCaseDetails(this.caseId));
  }

  async updateRecommendation(recommendation: SelectedRecommendation) {
    await this.updateAttributes(this.caseId, {
      selectedRecommendation: recommendation,
    });
  }

  async updateCaseStatusToCompleted() {
    await this.updateAttributes(this.caseId, { status: "Complete" });
    await flowResult(this.caseStore.psiStore.staffStore.loadStaffInfo());
  }

  async updateOnboardingTopicStatus(
    currentTopic: FormAttributes["currentOnboardingTopic"],
  ) {
    await this.updateAttributes(this.caseId, {
      currentOnboardingTopic: currentTopic,
    });
  }

  async updateRecommendedOpportunities(
    toggledOpportunity: OpportunitiesIdentifier[number],
  ) {
    const shouldRemoveOpportunity = this.recommendedOpportunities.find(
      (opp) => opp.opportunityName === toggledOpportunity.opportunityName,
    );
    const updatedOpportunitiesList = shouldRemoveOpportunity
      ? this.recommendedOpportunities.filter(
          (opp) => opp.opportunityName !== toggledOpportunity.opportunityName,
        )
      : [...this.recommendedOpportunities, toggledOpportunity];
    this.recommendedOpportunities = updatedOpportunitiesList;
    await this.updateAttributes(this.caseId, {
      recommendedOpportunities: updatedOpportunitiesList,
    });
  }
}
