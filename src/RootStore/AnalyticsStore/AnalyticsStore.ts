// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
// TODO(#2518): Investigate if this is necessary
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="window.d.ts"/>

import { clone } from "lodash";
import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from "uuid";

import { SearchType } from "../../core/models/types";
import { MilestonesTab } from "../../core/WorkflowsMilestones/MilestonesCaseloadView";
import { SupervisionTaskCategory } from "../../core/WorkflowsTasks/fixtures";
import { DeclineReason } from "../../FirestoreStore";
import { OpportunityStatus, OpportunityType } from "../../WorkflowsStore";
import {
  SupervisionNeedType,
  SupervisionTaskType,
} from "../../WorkflowsStore/Task/types";
import type RootStore from "..";

const isAnalyticsEnabled = process.env.NODE_ENV !== "development";

type OpportunityTrackingMetadata = {
  justiceInvolvedPersonId: string;
  opportunityType: OpportunityType;
};

type TasksTrackingMetadata = {
  justiceInvolvedPersonId: string;
  taskTypes: (SupervisionTaskType | SupervisionNeedType)[];
};

export default class AnalyticsStore {
  rootStore;

  sessionId = uuidv4();

  constructor({ rootStore }: { rootStore: typeof RootStore }) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
  }

  get disableAnalytics(): boolean {
    return this.rootStore.isImpersonating || !isAnalyticsEnabled;
  }

  identify(userId: string): void {
    const { isImpersonating } = this.rootStore;
    const traits = { sessionId: this.sessionId };

    const log = `${
      isImpersonating ? "[Impersonation]" : ""
    }[Analytics] Identifying user: ${userId}, with traits: ${JSON.stringify(
      traits
    )}`;

    if (this.disableAnalytics) {
      // eslint-disable-next-line
      console.log(log);
      return;
    }

    window.analytics.identify(userId, traits);
  }

  track(eventName: string, metadata?: Record<string, unknown>): void {
    const { isImpersonating } = this.rootStore;

    const fullMetadata = clone(metadata) || {};
    fullMetadata.sessionId = this.sessionId;

    const log = `${
      isImpersonating ? "[Impersonation]" : ""
    }[Analytics] Tracking event name: ${eventName}, with metadata: ${JSON.stringify(
      fullMetadata
    )}`;

    if (this.disableAnalytics) {
      // eslint-disable-next-line
      console.log(log);
      return;
    }
    window.analytics.track(eventName, fullMetadata);
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

  trackSurfacedInList(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.surfaced_in_list", metadata);
  }

  trackSetOpportunityStatus<
    Metadata extends OpportunityTrackingMetadata & {
      status: OpportunityStatus;
    }
  >(metadata: Metadata): void {
    this.track("frontend.opportunity_status_updated", metadata);
  }

  trackProfileViewed(metadata: { justiceInvolvedPersonId: string }): void {
    this.track("frontend.profile_viewed", metadata);
  }

  trackCaseloadSearch(metadata: {
    searchCount: number;
    isDefault: boolean;
    searchType: SearchType;
  }): void {
    this.track("frontend.caseload_search", metadata);
  }

  trackOpportunityPreviewed(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.opportunity_previewed", metadata);
  }

  trackTaskPreviewed(metadata: TasksTrackingMetadata): void {
    this.track("frontend.tasks_previewed", metadata);
  }

  trackOpportunityMarkedEligible(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.opportunity_marked_eligible", metadata);
  }

  trackReferralFormCopiedToClipboard(
    metadata: OpportunityTrackingMetadata
  ): void {
    this.track("frontend.referral_form_copied_to_clipboard", metadata);
  }

  trackReferralFormSubmitted(metadata: OpportunityTrackingMetadata): void {
    this.track("frontend.referral_form_submitted", metadata);
  }

  trackTaskFilterSelected(metadata: {
    taskCategory: SupervisionTaskCategory;
    selectedSearchIds: string[];
  }): void {
    this.track("frontend.task_filter_selected", metadata);
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
}
