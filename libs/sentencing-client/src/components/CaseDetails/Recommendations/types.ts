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

import { Dispatch, SetStateAction } from "react";

import { Case, CaseInsight, Client, Insight } from "../../../api";
import { CreateOrUpdateRecommendation } from "../../../datastores/types";
import { GeoConfig } from "../../../geoConfigs/types";
import {
  OpportunitiesIdentifier,
  RecommendationType,
  SelectedRecommendation,
} from "../types";

export type RecommendationsProps = {
  firstName?: string;
  geoConfig: GeoConfig;
  selectedRecommendation?: SelectedRecommendation;
  lastSavedRecommendation?: SelectedRecommendation;
  recommendedOpportunities?: OpportunitiesIdentifier;
  insight?: CaseInsight;
  handleRecommendationUpdate: (recommendation: string) => void;
  saveRecommendation: () => void;
  openSummaryReport: () => void;
  isCreatingRecommendation: boolean;
  setIsCreatingRecommendation: Dispatch<SetStateAction<boolean>>;
  analytics: {
    trackCreateOrUpdateRecommendationClicked: (
      type: CreateOrUpdateRecommendation,
    ) => void;
    trackCopySummaryToClipboardClicked: () => void;
    trackDownloadReportClicked: () => void;
    trackCaseStatusCompleteClicked: () => void;
  };
};

export type RecommendationsOptionProps = {
  option: RecommendationOption;
  isSelectedRecommendation: boolean;
  handleRecommendationUpdate: RecommendationsProps["handleRecommendationUpdate"];
  smallFont: boolean;
  isRecorded: boolean;
  isDisabled: boolean;
  matchingRecommendationOptionsForOpportunities?: (
    | RecommendationType
    | string
  )[];
  children?: React.ReactNode;
};

export type RecommendationOptionTemplateBase = {
  label: string;
  sentenceLengthBucketStart?: number;
  sentenceLengthBucketEnd?: number;
  recommendationType?: string;
};

export type RecommendationOption = {
  key: string;
  label: string;
  opportunities?: string[];
  recidivismRate?: number;
  historicalSentencingRate?: number;
};

export type GenerateRecommendationProps = {
  recommendation?: string | null;
  fullName?: string;
  needs?: Case["needsToBeAddressed"];
  opportunityDescriptions?: string[];
  protectiveFactors?: Case["protectiveFactors"];
  gender?: Client["gender"];
  sentenceLengthStart?: number;
  sentenceLengthEnd?: number;
  geoConfig: GeoConfig;
};

export type SummaryProps = {
  recommendation: string;
  sentenceLengthStart?: number;
  sentenceLengthEnd?: number;
  name?: string;
  possessive: string;
  object: string;
  salutation: string | null;
  subject: string;
  needs: Case["needsToBeAddressed"];
  opportunitiesList?: string;
  protectiveFactorsList?: string;
  hasNeeds: boolean;
  hasOpportunities: boolean;
  hasNeedsAndOpportunities: boolean;
  hasProtectiveFactors: boolean;
  hasSingleProtectiveFactor: boolean;
};

export type Pronouns = Record<
  Client["gender"] | "UNKNOWN",
  {
    subject: string;
    possessive: string;
    object: string;
    salutation: string | null;
  }
>;

export type NeedsToDisplayName = {
  [key in Case["needsToBeAddressed"][number]]?: string;
};

export type DispositionData = NonNullable<Insight>["dispositionData"][number];
export type RollupRecidivismSeries =
  NonNullable<Insight>["rollupRecidivismSeries"][number];
