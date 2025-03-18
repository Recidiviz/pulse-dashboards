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

import { Staff } from "../api";
import { RecommendationOptionType } from "../components/CaseDetails/Recommendations/constants";
import {
  RecommendationOptionTemplateBase,
  SummaryProps,
} from "../components/CaseDetails/Recommendations/types";
import { RecommendationType } from "../components/CaseDetails/types";
import { AttributeKey } from "../components/Dashboard/types";

export type StateCode = Staff["stateCode"];

export type GeoConfigRecommendation = {
  type: RecommendationOptionType;
  /**
   * If undefined, shows the list of opportunities for all recommendation options
   * If empty array, does not show a list of opportunities for any recommendation options
   * If non-empty array, show a list of opportunities only for the listed recommendation options
   */
  matchingRecommendationOptionsForOpportunities?: (
    | RecommendationType
    | string
  )[];
  baseOptionsTemplate: RecommendationOptionTemplateBase[];
  summaryGenerator: (props: SummaryProps) => string | void;
};

export type GeoConfig = {
  excludedAttributeKeys: AttributeKey[];
  recommendation: GeoConfigRecommendation;
  omsSystem: string;
  ExternalOpportunityLogo?: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;
};
