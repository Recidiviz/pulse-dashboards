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

import { MutableCaseAttributes, RecommendationType } from "../types";

export type RecommendationsProps = {
  firstName?: string;
  fullName?: string;
  selectedRecommendation?: MutableCaseAttributes["selectedRecommendation"];
  lastSavedRecommendation?: MutableCaseAttributes["selectedRecommendation"];
  handleRecommendationUpdate: (recommendation: RecommendationType) => void;
  saveRecommendation: () => void;
  setCaseStatusCompleted: () => void;
};

export type RecommendationsOptionProps = {
  option: RecommendationOption;
  isSelectedRecommendation: boolean;
  handleRecommendationUpdate: RecommendationsProps["handleRecommendationUpdate"];
  smallFont: boolean;
  isRecorded: boolean;
  children?: React.ReactNode;
};

export type RecommendationOption = {
  key: RecommendationType;
  label: RecommendationType | string;
  opportunities?: string[];
  recidivismRate?: number;
  historicalSentencingRate?: number;
};
