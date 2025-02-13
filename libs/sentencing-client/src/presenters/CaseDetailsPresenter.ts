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

import { flowResult, makeAutoObservable, when } from "mobx";

import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
  isHydrated,
} from "~hydration-utils";

import { Case, Opportunities } from "../api";
import { filterEligibleOpportunities } from "../components/CaseDetails/Opportunities/utils";
import {
  FormAttributes,
  MutableCaseAttributes,
  OpportunitiesIdentifier,
  RecommendationType,
  SelectedRecommendation,
} from "../components/CaseDetails/types";
import { CaseStore } from "../datastores/CaseStore";
import {
  CreateOrUpdateRecommendation,
  OnboardingNextOrBack,
  OpportunityViewOrigin,
} from "../datastores/types";

export class CaseDetailsPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  recommendedOpportunities: OpportunitiesIdentifier;

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
        await flowResult(this.caseStore.loadCounties());
        await flowResult(this.caseStore.loadCaseDetails(this.caseId));
        await flowResult(this.caseStore.loadCommunityOpportunities());
      },
    });

    when(
      () => isHydrated(this),
      () => {
        this.caseStore.setActiveCaseId(this.caseId);
        this.recommendedOpportunities =
          this.caseAttributes?.recommendedOpportunities ?? [];
      },
    );
  }

  get stateCode() {
    return this.caseStore.psiStore.stateCode;
  }

  get geoConfig() {
    return this.caseStore.psiStore.geoConfig;
  }

  get staffPseudoId() {
    return this.caseStore.psiStore.staffPseudoId;
  }

  get caseAttributes() {
    return this.caseStore.caseAttributes;
  }

  get caseEligibilityAttributes() {
    const {
      age,
      clientGender,
      lsirScore,
      needsToBeAddressed,
      substanceUseDisorderDiagnosis,
      asamCareRecommendation,
      mentalHealthDiagnoses,
      isVeteran,
      isCurrentOffenseSexual,
      isCurrentOffenseViolent,
      previouslyIncarceratedOrUnderSupervision,
      hasPreviousFelonyConviction,
      hasPreviousViolentOffenseConviction,
      hasPreviousSexOffenseConviction,
      hasPreviousTreatmentCourt,
      hasDevelopmentalDisability,
      hasOpenChildProtectiveServicesCase,
      plea,
      county: countyOfSentencing,
      district: districtOfSentencing,
    } = this.caseAttributes ?? {};
    const { district: districtOfResidence, county: countyOfResidence } =
      this.caseAttributes?.client ?? {};

    return {
      age,
      clientGender,
      lsirScore,
      needsToBeAddressed,
      substanceUseDisorderDiagnosis,
      asamCareRecommendation,
      mentalHealthDiagnoses,
      isVeteran,
      isCurrentOffenseSexual,
      isCurrentOffenseViolent,
      previouslyIncarceratedOrUnderSupervision,
      hasPreviousFelonyConviction,
      hasPreviousViolentOffenseConviction,
      hasPreviousSexOffenseConviction,
      hasPreviousTreatmentCourt,
      hasDevelopmentalDisability,
      hasOpenChildProtectiveServicesCase,
      plea,
      countyOfResidence,
      countyOfSentencing,
      districtOfResidence,
      districtOfSentencing,
    };
  }

  get insight() {
    return this.caseStore.insight;
  }

  get activeEligibleCommunityOpportunities(): Opportunities {
    return this.caseStore.communityOpportunities.filter(
      (opportunity) =>
        opportunity.active &&
        filterEligibleOpportunities(
          opportunity,
          this.caseEligibilityAttributes,
        ),
    );
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  async updateAttributes(attributes?: MutableCaseAttributes) {
    if (!attributes) return;

    await flowResult(this.caseStore.updateCaseDetails(this.caseId, attributes));
    await flowResult(this.caseStore.loadCaseDetails(this.caseId));
    await flowResult(this.caseStore.psiStore.staffStore.loadStaffInfo());
  }

  async updateRecommendation(recommendation: SelectedRecommendation) {
    await this.updateAttributes({
      selectedRecommendation: recommendation,
    });
  }

  async updateCaseStatusToCompleted() {
    await this.updateAttributes({ status: "Complete" });
  }

  async updateOnboardingTopicStatus(
    currentTopic: FormAttributes["currentOnboardingTopic"],
  ) {
    await this.updateAttributes({
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
    await this.updateAttributes({
      recommendedOpportunities: updatedOpportunitiesList,
    });
  }

  // TODO(#33262) - Refactor tracking functions
  trackCaseDetailsPageViewed() {
    this.caseStore.psiStore.analyticsStore.trackCaseDetailsPageViewed({
      viewedBy: this.staffPseudoId,
      caseId: this.caseId,
    });
  }

  trackOnboardingPageViewed(
    onboardingTopic: Case["currentOnboardingTopic"],
    buttonClicked: OnboardingNextOrBack,
  ) {
    this.caseStore.psiStore.analyticsStore.trackOnboardingPageViewed({
      viewedBy: this.staffPseudoId,
      onboardingTopic,
      buttonClicked,
      caseId: this.caseId,
    });
  }

  trackEditCaseDetailsClicked() {
    this.caseStore.psiStore.analyticsStore.trackEditCaseDetailsClicked({
      viewedBy: this.staffPseudoId,
      caseId: this.caseId,
    });
  }

  trackOpportunityModalOpened(opportunityNameProviderName: string) {
    this.caseStore.psiStore.analyticsStore.trackOpportunityModalOpened({
      viewedBy: this.staffPseudoId,
      opportunityNameProviderName,
      caseId: this.caseId,
    });
  }

  trackAddOpportunityToRecommendationClicked(
    opportunityNameProviderName: string,
    origin: OpportunityViewOrigin,
  ) {
    this.caseStore.psiStore.analyticsStore.trackAddOpportunityToRecommendationClicked(
      {
        viewedBy: this.staffPseudoId,
        opportunityNameProviderName,
        origin,
        caseId: this.caseId,
      },
    );
  }

  trackRemoveOpportunityFromRecommendationClicked(
    opportunityNameProviderName: string,
    origin: OpportunityViewOrigin,
  ) {
    this.caseStore.psiStore.analyticsStore.trackRemoveOpportunityFromRecommendationClicked(
      {
        viewedBy: this.staffPseudoId,
        opportunityNameProviderName,
        origin,
        caseId: this.caseId,
      },
    );
  }

  trackRecommendedDispositionChanged(
    selectedRecommendation: RecommendationType | string,
  ) {
    this.caseStore.psiStore.analyticsStore.trackRecommendedDispositionChanged({
      viewedBy: this.staffPseudoId,
      selectedRecommendation,
      caseId: this.caseId,
    });
  }

  trackCreateOrUpdateRecommendationClicked(type: CreateOrUpdateRecommendation) {
    this.caseStore.psiStore.analyticsStore.trackCreateOrUpdateRecommendationClicked(
      {
        viewedBy: this.staffPseudoId,
        type,
        caseId: this.caseId,
      },
    );
  }

  trackCopySummaryToClipboardClicked() {
    this.caseStore.psiStore.analyticsStore.trackCopySummaryToClipboardClicked({
      viewedBy: this.staffPseudoId,
      caseId: this.caseId,
    });
  }

  trackDownloadReportClicked() {
    this.caseStore.psiStore.analyticsStore.trackDownloadReportClicked({
      viewedBy: this.staffPseudoId,
      caseId: this.caseId,
    });
  }

  trackCaseStatusCompleteClicked() {
    this.caseStore.psiStore.analyticsStore.trackCaseStatusCompleteClicked({
      viewedBy: this.staffPseudoId,
      caseId: this.caseId,
    });
  }
}
