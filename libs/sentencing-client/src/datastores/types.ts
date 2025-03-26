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

import { SortDirection } from "@tanstack/react-table";

import { Case, Client } from "../api";
import {
  CaseListTableCase,
  RecommendationStatusFilter,
} from "../components/Dashboard/types";
import { StateCode } from "../geoConfigs/types";

export type OnboardingNextOrBack = "next" | "back";

export type OpportunityViewOrigin = "table" | "modal";

export type CreateOrUpdateRecommendation = "create" | "update";

export type UserStateCode = "RECIDIVIZ" | "CSG" | StateCode;

export type PageOrClickTrackingMetadata = {
  viewedBy?: string;
  caseId?: string;
};

export type CreateOrUpdateRecommendationTrackingMetadata = {
  viewedBy?: string;
  type: CreateOrUpdateRecommendation;
  caseId: string;
};

export type IndividualCaseClickedWithStatusMetadata = {
  viewedBy?: string;
  caseId: string;
  status: CaseListTableCase["status"];
};

export type RecommendationStatusFilterMetadata = {
  viewedBy?: string;
  filters: RecommendationStatusFilter[];
};

export type SortOrderTrackingMetadata = {
  viewedBy?: string;
  columnName?: string;
  order: false | SortDirection;
};

export type OnboardingTrackingMetadata = {
  viewedBy?: string;
  caseId: string;
  onboardingTopic: Case["currentOnboardingTopic"];
  buttonClicked: OnboardingNextOrBack;
};

export type RecommendedDispositionTrackingMetadata = {
  viewedBy?: string;
  caseId: string;
  selectedRecommendation: string;
};

export type OpportunityViewedTrackingMetadata = {
  viewedBy?: string;
  caseId: string;
  opportunityNameProviderName: string;
};

export type OpportunityWithOriginTrackingMetadata = {
  viewedBy?: string;
  caseId: string;
  opportunityNameProviderName: string;
  origin: "table" | "modal";
};

export type CaseAttributes = Partial<Case> & {
  clientGender?: Client["gender"];
};

// Feature variants exclusive to this app
export type FeatureVariant =
  | "offenseOverrideControls"
  | "protectiveFactors"
  | "editCountyFields"
  | "mandatoryMinimum"
  | "psiSupervisor";

export type FeatureVariantValue = {
  activeDate?: Date;
  variant?: string;
  activeTenants?: StateCode[];
};
