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

import { PSIStore, RootStore } from "../datastores/PSIStore";
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
} from "../datastores/types";

export const createMockRootStore = (userPseudoIdOverride?: string | null) => {
  const mockRootStore = {
    currentTenantId: "US_ID",
    userStore: {
      userPseudoId:
        userPseudoIdOverride === null
          ? undefined
          : userPseudoIdOverride ?? "TestID-123",
      getToken: () => Promise.resolve("auth0-token"),
      isRecidivizUser: false,
      isImpersonating: false,
      activeFeatureVariants: {},
    },
    analyticsStore: {
      rootStore: {} as RootStore,
      sessionId: "session-test",
      disableAnalytics: true,
      identify: (userId: string) => null,
      track: (eventName: string, metadata?: Record<string, unknown>) => null,
      page: (pagePath: string) => null,
      trackDashboardPageViewed: (metadata: PageOrClickTrackingMetadata) => null,
      trackIndividualCaseClicked: (
        metadata: IndividualCaseClickedWithStatusMetadata,
      ) => null,
      trackRecommendationStatusFilterChanged: (
        metadata: RecommendationStatusFilterMetadata,
      ) => null,
      trackDashboardSortOrderChanged: (metadata: SortOrderTrackingMetadata) =>
        null,
      trackCaseDetailsPageViewed: (metadata: PageOrClickTrackingMetadata) =>
        null,
      trackOnboardingPageViewed: (metadata: OnboardingTrackingMetadata) => null,
      trackEditCaseDetailsClicked: (metadata: PageOrClickTrackingMetadata) =>
        null,
      trackOpportunityModalOpened: (
        metadata: OpportunityViewedTrackingMetadata,
      ) => null,
      trackAddOpportunityToRecommendationClicked: (
        metadata: OpportunityWithOriginTrackingMetadata,
      ) => null,
      trackRemoveOpportunityFromRecommendationClicked: (
        metadata: OpportunityWithOriginTrackingMetadata,
      ) => null,
      trackRecommendedDispositionChanged: (
        metadata: RecommendedDispositionTrackingMetadata,
      ) => null,
      trackCreateOrUpdateRecommendationClicked: (
        metadata: CreateOrUpdateRecommendationTrackingMetadata,
      ) => null,
      trackCopySummaryToClipboardClicked: (
        metadata: PageOrClickTrackingMetadata,
      ) => null,
      trackDownloadReportClicked: (metadata: PageOrClickTrackingMetadata) =>
        null,
      trackCaseStatusCompleteClicked: (metadata: PageOrClickTrackingMetadata) =>
        null,
    },
  };
  return mockRootStore;
};

export const createMockPSIStore = (options?: {
  userPseudoIdOverride?: string | null;
  hideApiUrl?: boolean;
}) => {
  import.meta.env["VITE_SENTENCING_API_URL"] = options?.hideApiUrl
    ? undefined
    : "mockUrl";

  const mockRootStore = createMockRootStore(options?.userPseudoIdOverride);
  const psiStore = new PSIStore(mockRootStore);
  return psiStore;
};
