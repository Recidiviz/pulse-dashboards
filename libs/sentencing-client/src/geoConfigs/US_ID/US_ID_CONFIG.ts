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

import FindhelpLogo from "../../components/assets/findhelp.svg?react";
import { RecommendationOptionType } from "../../components/CaseDetails/Recommendations/constants";
import { RecommendationType } from "../../components/CaseDetails/types";
import { convertDistrictToDistrictCode } from "../../utils/utils";
import { GeoConfig } from "../types";
import { generateIdahoSummary } from "./utils";

export const US_ID_CONFIG: GeoConfig = {
  excludedAttributeKeys: [],
  recommendation: {
    type: RecommendationOptionType.SentenceType,
    matchingRecommendationOptionsForOpportunities: [
      RecommendationType.Probation,
    ],
    baseOptionsTemplate: [
      {
        label: RecommendationType.Probation,
        recommendationType: RecommendationType.Probation,
      },
      {
        label: RecommendationType.Rider,
        recommendationType: RecommendationType.Rider,
      },
      {
        label: RecommendationType.Term,
        recommendationType: RecommendationType.Term,
      },
    ],
    summaryGenerator: generateIdahoSummary,
  },
  omsSystem: "Atlas",
  ExternalOpportunityLogo: FindhelpLogo,
  orgName: "IDOC",
  infoPageLink: "https://www.recidiviz.org/sentencing/idaho",
  convertDistrictToDistrictCodeFn: convertDistrictToDistrictCode,
};
