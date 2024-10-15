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

import { keyBy, startCase, toLower } from "lodash";
import { flowResult, makeAutoObservable, when } from "mobx";
import moment from "moment";

import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
  isHydrated,
} from "~hydration-utils";

import { Case, Client, Insight, Opportunities } from "../api";
import { CaseDetailsForm } from "../components/CaseDetails/Form/CaseDetailsForm";
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

  private caseDetailsForm?: CaseDetailsForm;

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
        await flowResult(this.caseStore.loadCaseDetails(this.caseId));
        await flowResult(this.caseStore.loadCommunityOpportunities());
      },
    });

    when(
      () => isHydrated(this),
      () => {
        this.caseDetailsForm = new CaseDetailsForm(
          this,
          this.offensesByName,
          this.getInsight,
        );
        this.recommendedOpportunities =
          this.caseAttributes.recommendedOpportunities ?? [];
      },
    );
  }

  get staffPseudoId() {
    return this.caseStore.psiStore.staffPseudoId;
  }

  get caseAttributes(): Case & { clientGender?: Client["gender"] } {
    const currentCase = this.caseStore.caseDetailsById[this.caseId];
    if (currentCase.client?.fullName) {
      currentCase.client.fullName = startCase(
        toLower(currentCase.client?.fullName),
      );
    }
    return { ...currentCase, clientGender: currentCase.client?.gender };
  }

  get caseEligibilityAttributes() {
    const {
      lsirScore,
      needsToBeAddressed,
      substanceUseDisorderDiagnosis,
      asamCareRecommendation,
      mentalHealthDiagnoses,
      isVeteran,
      previouslyIncarceratedOrUnderSupervision,
      hasPreviousFelonyConviction,
      hasPreviousViolentOffenseConviction,
      hasPreviousSexOffenseConviction,
      hasPreviousTreatmentCourt,
      hasDevelopmentalDisability,
      hasOpenChildProtectiveServicesCase,
      plea,
      county,
    } = this.caseAttributes ?? {};
    const { birthDate, district } = this.caseAttributes?.client ?? {};

    return {
      age: moment().diff(birthDate, "years"),
      lsirScore,
      needsToBeAddressed,
      substanceUseDisorderDiagnosis,
      asamCareRecommendation,
      mentalHealthDiagnoses,
      isVeteran,
      previouslyIncarceratedOrUnderSupervision,
      hasPreviousFelonyConviction,
      hasPreviousViolentOffenseConviction,
      hasPreviousSexOffenseConviction,
      hasPreviousTreatmentCourt,
      hasDevelopmentalDisability,
      hasOpenChildProtectiveServicesCase,
      plea,
      district, // district of client's residence
      county, // district + county of sentencing
    };
  }

  get offensesByName() {
    return keyBy(this.caseStore.offenses, (offense) => offense.name);
  }

  get insight() {
    return this.caseStore.insight;
  }

  get communityOpportunities(): Opportunities {
    return this.caseStore.communityOpportunities.filter((opportunity) =>
      filterEligibleOpportunities(opportunity, this.caseEligibilityAttributes),
    );
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

  async updateAttributes(
    caseId: string,
    attributes?: MutableCaseAttributes,
    mergeUpdates?: boolean,
  ) {
    if (!attributes && JSON.stringify(this.form?.transformedUpdates) === "{}")
      return;
    const updates = mergeUpdates
      ? { ...this.form?.transformedUpdates, ...attributes }
      : attributes ?? this.form?.transformedUpdates;
    await flowResult(this.caseStore.updateCaseDetails(caseId, updates));
    await flowResult(this.caseStore.loadCaseDetails(this.caseId));
    await flowResult(this.caseStore.psiStore.staffStore.loadStaffInfo());
  }

  async updateRecommendation(recommendation: SelectedRecommendation) {
    await this.updateAttributes(this.caseId, {
      selectedRecommendation: recommendation,
    });
  }

  async updateCaseStatusToCompleted() {
    await this.updateAttributes(this.caseId, { status: "Complete" });
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
    selectedRecommendation: RecommendationType,
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

  async getInsight(
    offense: string,
    lsirScore: number,
  ): Promise<Insight | undefined> {
    const currentCase = this.caseStore.caseDetailsById[this.caseId];
    const gender = currentCase.client?.gender;
    if (!gender) return;

    await flowResult(this.caseStore.loadInsight(offense, gender, lsirScore));
    return this.caseStore.insight;
  }
}
