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

import { AnalyticsBrowser } from "@segment/analytics-next";
import { clone } from "lodash";
import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";

import { isDemoMode, isTestEnv } from "~client-env-utils";
import {
  ActionStrategyType,
  OpportunityType,
  RosterChangeRequest,
} from "~datatypes";
import {
  CreateOrUpdateRecommendationTrackingMetadata,
  IndividualCaseClickedWithStatusMetadata,
  OnboardingTrackingMetadata,
  OpportunityViewedTrackingMetadata,
  OpportunityWithOriginTrackingMetadata,
  PageOrClickTrackingMetadata,
  RecommendationStatusFilterMetadata,
  RecommendedDispositionTrackingMetadata,
  SortOrderTrackingMetadata,
} from "~sentencing-client";

import { SearchType } from "../../core/models/types";
import { MilestonesTab } from "../../core/WorkflowsMilestones/MilestonesCaseloadView";
import { SupervisionTaskCategory } from "../../core/WorkflowsTasks/fixtures";
import { DeclineReason } from "../../FirestoreStore";
import { OpportunityStatus, OpportunityTab } from "../../WorkflowsStore";
import {
  SupervisionNeedType,
  SupervisionTaskType,
} from "../../WorkflowsStore/Task/types";
import type RootStore from "../index";

const isAnalyticsDisabled =
  isDemoMode() || !["staging", "production"].includes(import.meta.env.MODE);

type SupervisorsListPageTrackingMetadata = {
  viewedBy?: string;
};

type SupervisorPageTrackingMetadata = {
  supervisorPseudonymizedId: string;
  viewedBy?: string;
};

type StaffPageTrackingMetadata = {
  staffPseudonymizedId: string;
  supervisorPseudonymizedId?: string;
  viewedBy?: string;
  numOutlierMetrics?: number;
};

type StaffMetricTrackingMetadata = {
  staffPseudonymizedId: string;
  supervisorPseudonymizedId?: string;
  viewedBy?: string;
  metricId: string;
};

type ClientPageTrackingMetadata = {
  clientPseudonymizedId: string;
  outcomeDate: Date;
  viewedBy?: string;
};

type PageViewed30SecondsTrackingMetadata = {
  path: string;
  viewedBy?: string;
};

type ActionStrategySurfacedMetadata = {
  viewedBy?: string;
  pseudonymizedId: string;
  actionStrategy: ActionStrategyType;
};

type ActionStrategyPopupMetadata = {
  viewedBy?: string;
  pseudonymizedId?: string;
  actionStrategy: ActionStrategyType;
};

type ActionStrategyPopupViewed10SecondsTrackingMetadata = {
  viewedBy?: string;
  pseudonymizedId?: string;
  actionStrategy: ActionStrategyType;
};

type ActionStrategyListMetadata = {
  viewedBy?: string;
};

type SupervisorRosterModalViewedByMetadata = {
  supervisorPseudonymizedId: string;
  viewedBy?: string;
};

type RosterChangeRequestFormSubmittedByMetadata = Pick<
  RosterChangeRequest,
  "requestChangeType"
> & {
  supervisorPseudonymizedId: string;
  affectedOfficersExternalIds: string[];
  intercomTicketId?: string;
  submittedBy?: string;
  error?: string;
};

type OpportunityTrackingMetadata = {
  justiceInvolvedPersonId: string;
  opportunityType: OpportunityType;
  opportunityId?: string;
};

type TasksTrackingMetadata = {
  justiceInvolvedPersonId: string;
  taskTypes: (SupervisionTaskType | SupervisionNeedType)[];
  selectedCategory: SupervisionTaskCategory;
};

type TableViewChangedMetadata = {
  newViewType: "table" | "list";
  oldViewType: "table" | "list";
};

type TasksFilterChangedMetadata = {
  changedFilterCategory: string;
  changedFilterValue: string;
  changedFilterSelected: boolean;
  selectedFilters: Record<string, string[]>;
  onlyClicked: boolean;
};

type TasksFiltersResetMetadata = {
  selectedFiltersBeforeReset: Record<string, string[]>;
};

type TasksTableCategoryMetadata = {
  selectedCategory: SupervisionTaskCategory;
  previousCategory: SupervisionTaskCategory;
  newTabRowCount: number;
  selectedCaseloadIds: string[];
};

type SnoozeTrackingMetadata = OpportunityTrackingMetadata & {
  opportunityStatus: OpportunityStatus;
  snoozeForDays?: number;
  snoozeUntil?: string;
  reasons: string[];
};

export type CopyCTAMetadata = OpportunityTrackingMetadata & {
  stateCode: string;
  almostEligibleCriteria: string;
  justiceInvolvedPersonName: string;
  staffId?: string;
  staffName: string;
  date: Date;
};

export type UsIaEarlyDischargeActionsMetadata = {
  staffId: string;
  justiceInvolvedPersonId: string;
  action?: {
    type: string;
    actionPlan?: string;
    revisionRequest?: string;
    additionalNotes?: string;
    supervisorResponseType?: string;
  };
  currentStatus: string;
  subsequentStatus: string;
  revert?: boolean;
};

export type UsIaEarlyDischargeReferralFormSignatureMetadata = {
  justiceInvolvedPersonId: string;
  formType: "cbc" | "parole";
  signatureField: "officer" | "approver";
};

export default class AnalyticsStore {
  rootStore;
  segment;

  sessionId = uuidv4();

  constructor({
    rootStore,
    isTestMode,
  }: {
    rootStore: typeof RootStore;
    isTestMode?: boolean;
  }) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
    this.segment = AnalyticsBrowser.load(
      {
        writeKey: "YDsBLA1staRM3Eg0zXEA3hGnA42teFUe",
      },
      { disable: isTestMode },
    );
  }

  get shouldLogAnalyticsEvent(): boolean {
    const {
      isImpersonating,
      userStore: { isRecidivizUser },
    } = this.rootStore;
    return isImpersonating || isAnalyticsDisabled || isRecidivizUser;
  }

  get shouldSkipWriteToSegment(): boolean {
    const {
      isImpersonating,
      userStore: { isRecidivizUser },
    } = this.rootStore;
    return (
      isImpersonating ||
      isAnalyticsDisabled ||
      (isRecidivizUser && import.meta.env.VITE_DEPLOY_ENV !== "staging")
    );
  }

  identify(userId: string): void {
    const { isImpersonating } = this.rootStore;
    const traits = { sessionId: this.sessionId };

    const log = `${
      isImpersonating ? "[Impersonation]" : ""
    }[Analytics] Identifying user: ${userId}, with traits: ${JSON.stringify(
      traits,
    )}`;

    // eslint-disable-next-line
    if (this.shouldLogAnalyticsEvent) console.log(log);
    if (this.shouldSkipWriteToSegment) return;
    this.segment.identify(userId, traits);
  }

  track(eventName: string, metadata?: Record<string, unknown>): void {
    if (isTestEnv()) return;

    const { isImpersonating } = this.rootStore;

    const fullMetadata = clone(metadata) || {};
    fullMetadata.sessionId = this.sessionId;

    const log = `${
      isImpersonating ? "[Impersonation]" : ""
    }[Analytics] Tracking event name: ${eventName}, with metadata: ${JSON.stringify(
      fullMetadata,
    )}`;

    // eslint-disable-next-line
    if (this.shouldLogAnalyticsEvent) console.log(log);
    if (this.shouldSkipWriteToSegment) return;
    this.segment.track(eventName, fullMetadata);
  }

  page(pagePath: string) {
    const { isImpersonating } = this.rootStore;

    const log = `${
      isImpersonating ? "[Impersonation]" : ""
    }[Analytics] Tracking pageview: ${pagePath}`;

    // eslint-disable-next-line
    if (this.shouldLogAnalyticsEvent) console.log(log);
    if (this.shouldSkipWriteToSegment) return;
    this.segment.page(pagePath);
  }

  trackInsightsSupervisorsListPageViewed(
    metadata: SupervisorsListPageTrackingMetadata,
  ): void {
    this.track("frontend.outliers_supervisors_list_page_viewed", metadata);
  }

  trackInsightsSupervisorPageViewed(
    metadata: SupervisorPageTrackingMetadata,
  ): void {
    this.track("frontend.outliers_supervisor_page_viewed", metadata);
  }

  trackInsightsStaffPageViewed(metadata: StaffPageTrackingMetadata): void {
    this.track("frontend.outliers_staff_page_viewed", metadata);
  }

  trackInsightsStaffMetricViewed(metadata: StaffMetricTrackingMetadata): void {
    this.track("frontend.outliers_staff_metric_viewed", metadata);
  }

  trackInsightsClientPageViewed(metadata: ClientPageTrackingMetadata): void {
    this.track("frontend.outliers_client_page_viewed", metadata);
  }

  trackInsightsPageViewed30Seconds(
    metadata: PageViewed30SecondsTrackingMetadata,
  ): void {
    this.track("frontend.outliers_page_viewed_30_seconds", metadata);
  }

  trackInsightsActionStrategySurfaced(
    metadata: ActionStrategySurfacedMetadata,
  ): void {
    this.track("frontend.outliers_action_strategy_surfaced", metadata);
  }

  trackInsightsActionStrategyPopupViewed(
    metadata: ActionStrategyPopupMetadata,
  ): void {
    this.track("frontend.outliers_action_strategy_popup_viewed", metadata);
  }

  trackInsightsActionStrategyPopupViewed10seconds(
    metadata: ActionStrategyPopupViewed10SecondsTrackingMetadata,
  ): void {
    this.track(
      "frontend.outliers_action_strategy_popup_viewed_10_seconds",
      metadata,
    );
  }

  trackInsightsActionStrategyPopupViewedFromList(
    metadata: ActionStrategyPopupMetadata,
  ): void {
    this.track(
      "frontend.outliers_action_strategy_popup_viewed_from_list",
      metadata,
    );
  }

  trackInsightsActionStrategyListViewed(
    metadata: ActionStrategyListMetadata,
  ): void {
    this.track("frontend.outliers_action_strategy_list_viewed", metadata);
  }

  trackInsightsRosterModalViewed(
    metadata: SupervisorRosterModalViewedByMetadata,
  ): void {
    this.track("frontend.outliers_supervisor_roster_modal_viewed", metadata);
  }

  trackInsightsRosterChangeRequestFormSubmitted(
    metadata: RosterChangeRequestFormSubmittedByMetadata,
  ): void {
    this.track(
      "frontend.outliers_roster_change_request_form_submitted",
      metadata,
    );
  }

  trackReferralFormViewed(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.referral_form_viewed", metadata);
  }

  trackReferralFormFirstEdited(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.referral_form_first_edited", metadata);
  }

  trackReferralFormEdited(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.referral_form_edited", metadata);
  }

  trackReferralFormDownloaded(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.referral_form_downloaded", metadata);
  }

  trackDirectDownloadFormDownloaded(
    metadata: OpportunityTrackingMetadata & { formId: string },
  ): void {
    this.track("frontend.direct_download_form_downloaded", metadata);
  }

  trackSurfacedInList<
    Metadata extends OpportunityTrackingMetadata & {
      searchIdValue: string | undefined;
      searchField: string | undefined;
      tabTitle: string;
    },
  >(metadata: Metadata): void {
    this.track("frontend.surfaced_in_list", metadata);
  }

  trackOpportunityTabClicked(metadata: { tab: OpportunityTab }): void {
    this.track("frontend.opportunity_tab_clicked", metadata);
  }

  trackOpportunityTabOrderChanged(metadata: {
    tabOrder: OpportunityTab[];
    opportunityType: OpportunityType;
  }): void {
    this.track("frontend.opportunity_tab_order_changed", metadata);
  }

  trackOpportunityTableViewPreferenceChanged(
    metadata: TableViewChangedMetadata & { opportunityType: OpportunityType },
  ) {
    this.track("frontend.opportunity_table_view_preference_changed", metadata);
  }

  trackSetOpportunityStatus<
    Metadata extends OpportunityTrackingMetadata & {
      status: OpportunityStatus;
    },
  >(metadata: Metadata): void {
    this.track("frontend.opportunity_status_updated", metadata);
  }

  trackProfileViewed(metadata: { justiceInvolvedPersonId: string }): void {
    this.track("frontend.profile_viewed", metadata);
  }

  trackMethodologyLinkClicked(metadata: {
    path: string;
    methodologyLink: string;
  }): void {
    this.track("frontend.methodology_link_clicked", metadata);
  }
  /* TODO(#4601): Remove redirect after confirming no longer in use */
  trackMethodologyLinkRedirectedTo(metadata: {
    path: string;
    methodologyLink: string;
  }): void {
    this.track("frontend.methodology_link_redirected_to", metadata);
  }

  trackCaseloadSearch(metadata: {
    searchCount: number;
    isDefault: boolean;
    searchType?: SearchType;
  }): void {
    this.track("frontend.caseload_search", metadata);
  }

  trackOpportunityPreviewed(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.opportunity_previewed", metadata);
  }

  trackTaskPreviewed(metadata: TasksTrackingMetadata): void {
    this.track("frontend.tasks_previewed", metadata);
  }

  trackTaskHeaderToggled(title: string): void {
    this.track("frontend.task_header_toggled", { title });
  }

  trackTaskViewChanged(metadata: TableViewChangedMetadata): void {
    this.track("frontend.tasks_view_changed", metadata);
  }

  trackTaskFilterChanged(metadata: TasksFilterChangedMetadata): void {
    this.track("frontend.tasks_filter_changed", metadata);
  }

  trackTaskFiltersReset(metadata: TasksFiltersResetMetadata): void {
    this.track("frontend.tasks_filters_reset", metadata);
  }

  trackTaskFiltersCleared(): void {
    this.track("frontend.tasks_filters_cleared");
  }

  trackTaskFilterDropdownOpened(): void {
    this.track("frontend.task_filter_dropdown_opened");
  }

  trackTaskTableCategorySelected(metadata: TasksTableCategoryMetadata): void {
    this.track("frontend.task_table_category_selected", metadata);
  }

  trackTaskFilterSelected(metadata: {
    taskCategory: SupervisionTaskCategory;
    selectedSearchIds: string[];
  }): void {
    this.track("frontend.task_filter_selected", metadata);
  }

  trackOpportunityMarkedSubmitted(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.opportunity_marked_submitted", metadata);
  }

  trackOpportunityUnsubmitted(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.opportunity_unsubmitted", metadata);
  }

  trackReferralFormCopiedToClipboard(
    metadata: OpportunityTrackingMetadata,
  ): void {
    this.track("frontend.referral_form_copied_to_clipboard", metadata);
  }

  trackReferralFormSubmitted(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.referral_form_submitted", metadata);
  }

  // This event will not always fire on opportunity-related pages, but we care about
  // the opportunity type when it does.
  trackPersonIdCopiedtoClipboard(
    metadata: Partial<OpportunityTrackingMetadata> &
      Pick<OpportunityTrackingMetadata, "justiceInvolvedPersonId">,
  ): void {
    this.track("frontend.person_id_copied_to_clipboard", metadata);
  }

  trackMilestonesTabClick(metadata: { tab: MilestonesTab }) {
    this.track("frontend.milestones_tab_clicked", metadata);
  }

  trackMilestonesSidePanel(metadata: {
    tab: MilestonesTab;
    justiceInvolvedPersonId: string;
  }) {
    this.track("frontend.milestones_side_panel_opened", metadata);
  }

  trackMilestonesMessageDeclined(metadata: {
    justiceInvolvedPersonId: string;
    declineReasons: DeclineReason[];
  }) {
    this.track("frontend.milestones_message_declined", metadata);
  }

  trackMilestonesCongratulatedAnotherWay(metadata: {
    justiceInvolvedPersonId: string;
  }) {
    this.track("frontend.milestones_congratulated_another_way", metadata);
  }

  trackMilestonesCongratulationsSent(metadata: {
    justiceInvolvedPersonId: string;
  }) {
    this.track("frontend.milestones_congratulations_sent", metadata);
  }

  trackOpportunitySnoozed(metadata: SnoozeTrackingMetadata) {
    this.track("frontend.opportunity_snoozed", metadata);
  }

  trackOpportunitySnoozeCaseNoteCopied(metadata: SnoozeTrackingMetadata) {
    this.track("frontend.opportunity_snooze_case_note_copied", metadata);
  }

  trackAlmostEligibleCopyCTAViewed(metadata: CopyCTAMetadata) {
    this.track("frontend.almost_eligible_copy_cta_viewed", metadata);
  }

  trackAlmostEligibleCopyCTAClicked(metadata: CopyCTAMetadata) {
    this.track("frontend.almost_eligible_copy_cta_clicked", metadata);
  }

  trackUsIaEarlyDischargeOpportunityActions(
    metadata: UsIaEarlyDischargeActionsMetadata,
  ) {
    this.track("frontend.us_ia_early_discharge_opportunity_actions", metadata);
  }

  trackUsIaEarlyDischargeReferralFormSignatureAdded(
    metadata: UsIaEarlyDischargeReferralFormSignatureMetadata,
  ) {
    this.track(
      "frontend.us_ia_early_discharge_referral_form_signature_added",
      metadata,
    );
  }

  trackUsIaEarlyDischargeReferralFormSignatureRemoved(
    metadata: UsIaEarlyDischargeReferralFormSignatureMetadata,
  ) {
    this.track(
      "frontend.us_ia_early_discharge_referral_form_signature_removed",
      metadata,
    );
  }

  /****************************
   * Case Notes Search Tracking *
   ****************************/

  trackCaseNoteSearch(metadata: {
    userPseudonymizedId: string;
    clientPseudonymizedId: string;
    numResults?: number;
    error?: string | null;
  }) {
    this.track("frontend.case_note_search", metadata);
  }

  trackNoteClicked(metadata: {
    userPseudonymizedId: string;
    clientPseudonymizedId: string;
    docId: string;
  }) {
    this.track("frontend.case_note_search_note_clicked", metadata);
  }

  /****************************
   * PSI Application Tracking *
   ****************************/

  /** Dashboard */

  trackDashboardPageViewed(metadata: PageOrClickTrackingMetadata): void {
    this.track("frontend.sentencing_dashboard_page_viewed", metadata);
  }

  trackIndividualCaseClicked(
    metadata: IndividualCaseClickedWithStatusMetadata,
  ): void {
    this.track("frontend.sentencing_individual_case_clicked", metadata);
  }

  trackRecommendationStatusFilterChanged(
    metadata: RecommendationStatusFilterMetadata,
  ): void {
    this.track(
      "frontend.sentencing_recommendation_status_filter_changed",
      metadata,
    );
  }

  trackDashboardSortOrderChanged(metadata: SortOrderTrackingMetadata): void {
    this.track("frontend.sentencing_dashboard_sort_order_changed", metadata);
  }

  /** Case Details */

  trackCaseDetailsPageViewed(metadata: PageOrClickTrackingMetadata): void {
    this.track("frontend.sentencing_case_details_page_viewed", metadata);
  }

  trackOnboardingPageViewed(metadata: OnboardingTrackingMetadata): void {
    this.track("frontend.sentencing_onboarding_page_viewed", metadata);
  }

  trackEditCaseDetailsClicked(metadata: PageOrClickTrackingMetadata): void {
    this.track("frontend.sentencing_edit_case_details_clicked", metadata);
  }

  trackOpportunityModalOpened(
    metadata: OpportunityViewedTrackingMetadata,
  ): void {
    this.track("frontend.sentencing_opportunity_modal_opened", metadata);
  }

  trackAddOpportunityToRecommendationClicked(
    metadata: OpportunityWithOriginTrackingMetadata,
  ): void {
    this.track(
      "frontend.sentencing_add_opportunity_to_recommendation_clicked",
      metadata,
    );
  }

  trackRemoveOpportunityFromRecommendationClicked(
    metadata: OpportunityWithOriginTrackingMetadata,
  ): void {
    this.track(
      "frontend.sentencing_remove_opportunity_from_recommendation_clicked",
      metadata,
    );
  }

  trackRecommendedDispositionChanged(
    metadata: RecommendedDispositionTrackingMetadata,
  ): void {
    this.track("frontend.sentencing_recommended_disposition_changed", metadata);
  }

  trackCreateOrUpdateRecommendationClicked(
    metadata: CreateOrUpdateRecommendationTrackingMetadata,
  ): void {
    this.track(
      "frontend.sentencing_create_or_update_recommendation_clicked",
      metadata,
    );
  }

  trackCopySummaryToClipboardClicked(
    metadata: PageOrClickTrackingMetadata,
  ): void {
    this.track(
      "frontend.sentencing_copy_summary_to_clipboard_clicked",
      metadata,
    );
  }

  trackDownloadReportClicked(metadata: PageOrClickTrackingMetadata): void {
    this.track("frontend.sentencing_download_report_clicked", metadata);
  }

  trackCaseStatusCompleteClicked(metadata: PageOrClickTrackingMetadata): void {
    this.track("frontend.sentencing_case_status_complete_clicked", metadata);
  }
}
