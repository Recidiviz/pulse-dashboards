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

import { keyBy } from "lodash";

import { Case } from "../../../api";
import { GEO_CONFIG } from "../../../geoConfigs/geoConfigs";
import { formatListWithAnd } from "../../../utils/utils";
import { NeedsToBeAddressed } from "../constants";
import { needToDisplayNameMap, pronouns } from "./constants";
import { GenerateRecommendationProps, SummaryProps } from "./types";

export const formatNeedsList = (
  needs: Case["needsToBeAddressed"],
  needsExclusionList: Case["needsToBeAddressed"],
): string[] => {
  return needs
    .filter((need) => !needsExclusionList?.includes(need))
    .map((need) => needToDisplayNameMap[need] || NeedsToBeAddressed[need])
    .filter(Boolean);
};

export const generateRecommendationSummary = ({
  recommendation,
  fullName = "",
  lastName,
  needs = [],
  opportunityDescriptions = [],
  gender,
  stateCode,
}: GenerateRecommendationProps): string | void => {
  if (!recommendation) return;

  const { possessive, object, salutation, subject } = gender
    ? pronouns[gender]
    : pronouns["UNKNOWN"];
  const isBinaryOrTransMaleOrTransFemaleGender =
    gender && ["MALE", "FEMALE", "TRANS_MALE", "TRANS_FEMALE"].includes(gender);
  const name = isBinaryOrTransMaleOrTransFemaleGender ? lastName : fullName;

  const opportunitiesList = formatListWithAnd(
    opportunityDescriptions,
    "opportunities",
  );

  const hasNeeds = needs.length > 0;
  const hasOpportunities = opportunityDescriptions.length > 0;
  const hasNeedsAndOpportunities = hasNeeds && hasOpportunities;

  const sentenceInfoByLabel = keyBy(
    GEO_CONFIG[stateCode]?.recommendation.baseOptionsTemplate,
    "label",
  );
  const sentenceLengthStart =
    sentenceInfoByLabel[recommendation]?.sentenceLengthBucketStart;
  const sentenceLengthEnd =
    sentenceInfoByLabel[recommendation]?.sentenceLengthBucketEnd;

  const props: SummaryProps = {
    recommendation,
    sentenceLengthStart,
    sentenceLengthEnd,
    name,
    possessive,
    object,
    salutation,
    subject,
    needs,
    opportunitiesList,
    hasNeeds,
    hasOpportunities,
    hasNeedsAndOpportunities,
  };

  const generateSummary =
    GEO_CONFIG[stateCode]?.recommendation.summaryGenerator;

  if (generateSummary) return generateSummary(props);
};
