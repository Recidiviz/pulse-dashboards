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

import {
  ASAM_CARE_RECOMMENDATION_KEY,
  HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
  HAS_PREVIOUS_FELONY_KEY,
  HAS_PREVIOUS_TREATMENT_COURT_KEY,
  PLEA_KEY,
  REPORT_TYPE_KEY,
} from "../../components/CaseDetails/constants";
import { RecommendationOptionType } from "../../components/CaseDetails/Recommendations/constants";
import { GeoConfig } from "../types";
import { generateNorthDakotaSummary } from "./utils";

export const US_ND_CONFIG: GeoConfig = {
  excludedAttributeKeys: [
    REPORT_TYPE_KEY,
    ASAM_CARE_RECOMMENDATION_KEY,
    HAS_PREVIOUS_FELONY_KEY,
    HAS_PREVIOUS_TREATMENT_COURT_KEY,
    HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
    PLEA_KEY,
  ],
  recommendation: {
    type: RecommendationOptionType.SentenceLength,
    baseOptionsTemplate: [
      {
        label: "Less than one year",
        sentenceLengthBucketStart: 0,
        sentenceLengthBucketEnd: 1,
      },
      {
        label: "1-2 years",
        sentenceLengthBucketStart: 1,
        sentenceLengthBucketEnd: 2,
      },
      {
        label: "3-5 years",
        sentenceLengthBucketStart: 3,
        sentenceLengthBucketEnd: 5,
      },
      {
        label: "6-10 years",
        sentenceLengthBucketStart: 6,
        sentenceLengthBucketEnd: 10,
      },
      {
        label: "11-20 years",
        sentenceLengthBucketStart: 11,
        sentenceLengthBucketEnd: 20,
      },
      {
        label: "21+ years",
        sentenceLengthBucketStart: 21,
        sentenceLengthBucketEnd: -1,
      },
      {
        label: "Other",
      },
    ],
    summaryGenerator: generateNorthDakotaSummary,
  },
};
