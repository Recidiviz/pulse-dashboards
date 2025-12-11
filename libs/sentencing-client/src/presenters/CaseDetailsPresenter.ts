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
  SelectedRecommendation,
} from "../components/CaseDetails/types";
import { PSIStore } from "../datastores/PSIStore";
import {
  CreateOrUpdateRecommendation,
  OnboardingNextOrBack,
  OpportunityViewOrigin,
} from "../datastores/types";

export class CaseDetailsPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  recommendedOpportunities: OpportunitiesIdentifier;

  constructor(
    public readonly PSIStore: PSIStore,
    public caseId: string,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.recommendedOpportunities = [];
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.PSIStore.sentencingStore.staffStore.staffInfo === undefined)
            throw new Error("Failed to load staff details");
        },
        () => {
          if (this.PSIStore.caseDetailsById[this.caseId] === undefined)
            throw new Error("Failed to load case details");
        },
      ],
      populate: async () => {
        if (!this.PSIStore.sentencingStore.staffStore.staffInfo) {
          await flowResult(
            this.PSIStore.sentencingStore.staffStore.loadStaffInfo(),
          );
        }
        await flowResult(this.PSIStore.loadOffenses());
        await flowResult(this.PSIStore.loadCounties());
        await flowResult(this.PSIStore.loadCaseDetails(this.caseId));
        await flowResult(this.PSIStore.loadCommunityOpportunities());
      },
    });

    when(
      () => isHydrated(this),
      () => {
        this.PSIStore.setActiveCaseId(this.caseId);
        this.recommendedOpportunities =
          this.caseAttributes?.recommendedOpportunities ?? [];
      },
    );
  }

  get stateCode() {
    return this.PSIStore.sentencingStore.stateCode;
  }

  get geoConfig() {
    return this.PSIStore.sentencingStore.geoConfig;
  }

  get staffPseudoId() {
    return this.PSIStore.sentencingStore.staffPseudoId;
  }

  get caseAttributes() {
    return this.PSIStore.caseAttributes;
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
    return this.PSIStore.insight;
  }

  get activeEligibleCommunityOpportunities(): Opportunities {
    return this.PSIStore.communityOpportunities.filter(
      (opportunity) =>
        opportunity.active &&
        filterEligibleOpportunities(
          opportunity,
          this.caseEligibilityAttributes,
          this.geoConfig.convertDistrictToDistrictCodeFn,
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

    await flowResult(this.PSIStore.updateCaseDetails(this.caseId, attributes));
    await flowResult(this.PSIStore.loadCaseDetails(this.caseId));
    await flowResult(this.PSIStore.sentencingStore.staffStore.loadStaffInfo());
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
    this.PSIStore.sentencingStore.analyticsStore.trackCaseDetailsPageViewed({
      viewedBy: this.staffPseudoId,
      caseId: this.caseId,
    });
  }

  trackOnboardingPageViewed(
    onboardingTopic: Case["currentOnboardingTopic"],
    buttonClicked: OnboardingNextOrBack,
  ) {
    this.PSIStore.sentencingStore.analyticsStore.trackOnboardingPageViewed({
      viewedBy: this.staffPseudoId,
      onboardingTopic,
      buttonClicked,
      caseId: this.caseId,
    });
  }

  trackEditCaseDetailsClicked() {
    this.PSIStore.sentencingStore.analyticsStore.trackEditCaseDetailsClicked({
      viewedBy: this.staffPseudoId,
      caseId: this.caseId,
    });
  }

  trackOpportunityModalOpened(opportunityNameProviderName: string) {
    this.PSIStore.sentencingStore.analyticsStore.trackOpportunityModalOpened({
      viewedBy: this.staffPseudoId,
      opportunityNameProviderName,
      caseId: this.caseId,
    });
  }

  trackAddOpportunityToRecommendationClicked(
    opportunityNameProviderName: string,
    origin: OpportunityViewOrigin,
  ) {
    this.PSIStore.sentencingStore.analyticsStore.trackAddOpportunityToRecommendationClicked(
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
    this.PSIStore.sentencingStore.analyticsStore.trackRemoveOpportunityFromRecommendationClicked(
      {
        viewedBy: this.staffPseudoId,
        opportunityNameProviderName,
        origin,
        caseId: this.caseId,
      },
    );
  }

  trackRecommendedDispositionChanged(selectedRecommendation: string) {
    this.PSIStore.sentencingStore.analyticsStore.trackRecommendedDispositionChanged(
      {
        viewedBy: this.staffPseudoId,
        selectedRecommendation,
        caseId: this.caseId,
      },
    );
  }

  trackCreateOrUpdateRecommendationClicked(type: CreateOrUpdateRecommendation) {
    this.PSIStore.sentencingStore.analyticsStore.trackCreateOrUpdateRecommendationClicked(
      {
        viewedBy: this.staffPseudoId,
        type,
        caseId: this.caseId,
      },
    );
  }

  trackCopySummaryToClipboardClicked() {
    this.PSIStore.sentencingStore.analyticsStore.trackCopySummaryToClipboardClicked(
      {
        viewedBy: this.staffPseudoId,
        caseId: this.caseId,
      },
    );
  }

  trackDownloadReportClicked() {
    this.PSIStore.sentencingStore.analyticsStore.trackDownloadReportClicked({
      viewedBy: this.staffPseudoId,
      caseId: this.caseId,
    });
  }

  trackCaseStatusCompleteClicked() {
    this.PSIStore.sentencingStore.analyticsStore.trackCaseStatusCompleteClicked(
      {
        viewedBy: this.staffPseudoId,
        caseId: this.caseId,
      },
    );
  }
}
