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

import { GetTokenSilentlyOptions } from "@auth0/auth0-spa-js";
import { makeAutoObservable } from "mobx";

import { isOfflineMode } from "~client-env-utils";

import { APIClient } from "../api/APIClient";
import { OfflineAPIClient } from "../api/OfflineAPIClient";
import { CaseStore } from "./CaseStore";
import { StaffStore } from "./StaffStore";
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
} from "./types";

export interface RootStore {
  currentTenantId?: string;
  userStore: {
    userPseudoId?: string;
    isImpersonating: boolean;
    isRecidivizUser: boolean;
    getToken?: (
      options?: GetTokenSilentlyOptions,
    ) => Promise<string> | undefined;
  };
  analyticsStore: {
    rootStore: RootStore;
    sessionId: string;
    identify: (userId: string) => void;
    track: (eventName: string, metadata?: Record<string, unknown>) => void;
    page: (pagePath: string) => void;
    trackDashboardPageViewed: (metadata: PageOrClickTrackingMetadata) => void;
    trackIndividualCaseClicked: (
      metadata: IndividualCaseClickedWithStatusMetadata,
    ) => void;
    trackRecommendationStatusFilterChanged: (
      metadata: RecommendationStatusFilterMetadata,
    ) => void;
    trackDashboardSortOrderChanged: (
      metadata: SortOrderTrackingMetadata,
    ) => void;
    trackCaseDetailsPageViewed: (metadata: PageOrClickTrackingMetadata) => void;
    trackOnboardingPageViewed: (metadata: OnboardingTrackingMetadata) => void;
    trackEditCaseDetailsClicked: (
      metadata: PageOrClickTrackingMetadata,
    ) => void;
    trackOpportunityModalOpened: (
      metadata: OpportunityViewedTrackingMetadata,
    ) => void;
    trackAddOpportunityToRecommendationClicked: (
      metadata: OpportunityWithOriginTrackingMetadata,
    ) => void;
    trackRemoveOpportunityFromRecommendationClicked: (
      metadata: OpportunityWithOriginTrackingMetadata,
    ) => void;
    trackRecommendedDispositionChanged: (
      metadata: RecommendedDispositionTrackingMetadata,
    ) => void;
    trackCreateOrUpdateRecommendationClicked: (
      metadata: CreateOrUpdateRecommendationTrackingMetadata,
    ) => void;
    trackCopySummaryToClipboardClicked: (
      metadata: PageOrClickTrackingMetadata,
    ) => void;
    trackDownloadReportClicked: (metadata: PageOrClickTrackingMetadata) => void;
    trackCaseStatusCompleteClicked: (
      metadata: PageOrClickTrackingMetadata,
    ) => void;
  };
}

export class PSIStore {
  staffStore: StaffStore;

  caseStore: CaseStore;

  apiClient: APIClient | OfflineAPIClient;

  analyticsStore: RootStore["analyticsStore"];

  constructor(public rootStore: RootStore) {
    makeAutoObservable(this);
    this.apiClient = isOfflineMode()
      ? new OfflineAPIClient(this)
      : new APIClient(this);
    this.staffStore = new StaffStore(this);
    this.caseStore = new CaseStore(this);
    this.analyticsStore = this.rootStore.analyticsStore;
  }

  get staffPseudoId(): string | undefined {
    return this.rootStore.userStore.userPseudoId;
  }
}
