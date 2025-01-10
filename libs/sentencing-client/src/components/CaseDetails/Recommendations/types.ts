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

import { Case, CaseInsight, Client } from "../../../api";
import { CreateOrUpdateRecommendation } from "../../../datastores/types";
import { StateCode } from "../../../geoConfigs/types";
import {
  OpportunitiesIdentifier,
  RecommendationType,
  SelectedRecommendation,
} from "../types";

export type RecommendationsProps = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  age?: number;
  externalId?: string;
  gender?: Client["gender"];
  stateCode: Case["stateCode"];
  selectedRecommendation?: SelectedRecommendation;
  lastSavedRecommendation?: SelectedRecommendation;
  recommendedOpportunities?: OpportunitiesIdentifier;
  needs?: Case["needsToBeAddressed"];
  insight?: CaseInsight;
  handleRecommendationUpdate: (
    recommendation: RecommendationType | string,
  ) => void;
  saveRecommendation: () => void;
  setCaseStatusCompleted: () => Promise<void>;
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
  recommendationType?: RecommendationType;
};

export type RecommendationOption = {
  key: RecommendationType | string;
  label: RecommendationType | string;
  opportunities?: string[];
  recidivismRate?: number;
  historicalSentencingRate?: number;
};

export type GenerateRecommendationProps = {
  recommendation?: string | null;
  fullName?: string;
  lastName?: string;
  needs?: Case["needsToBeAddressed"];
  opportunityDescriptions?: string[];
  gender?: Client["gender"];
  sentenceLengthStart?: number;
  sentenceLengthEnd?: number;
  stateCode: StateCode;
};

export type SummaryProps = {
  recommendation: RecommendationType | string;
  sentenceLengthStart?: number;
  sentenceLengthEnd?: number;
  name?: string;
  possessive: string;
  object: string;
  salutation: string | null;
  subject: string;
  needs: Case["needsToBeAddressed"];
  opportunitiesList?: string;
  hasNeeds: boolean;
  hasOpportunities: boolean;
  hasNeedsAndOpportunities: boolean;
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
