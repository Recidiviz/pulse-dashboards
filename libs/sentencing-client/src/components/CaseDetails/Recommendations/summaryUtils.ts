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
import { formatListWithAnd } from "../../../utils/utils";
import { NeedsToBeAddressed, ProtectiveFactors } from "../constants";
import { OTHER_OPTION } from "../Form/constants";
import { needToDisplayNameMap, pronouns } from "./constants";
import { GenerateRecommendationProps, SummaryProps } from "./types";

const normalizedProtectiveFactors: Partial<
  Record<Case["protectiveFactors"][number], string>
> = {
  HighSchoolDiplomaOrHigherEducation: "a high level of academic achievement",
  ActivelyParticipatingInTreatmentPrograms:
    "been actively participating in treatment programs",
  ActiveInvolvementInCommunityActivities:
    "been actively involved in community activities",
  HistoryOfSuccessUnderSupervision: "had previous success under supervision",
  LengthyPeriodsOfSobrietyAfterCompletingTreatment:
    "had lengthy periods of sobriety after completing treatment",
  StrongSocialSupportNetwork: "a strong social support network",
};

export const formatProtectiveFactorsList = (
  protectiveFactors: Case["protectiveFactors"],
): string[] => {
  return protectiveFactors
    .filter((factor) => factor !== OTHER_OPTION)
    .map(
      (factor) =>
        normalizedProtectiveFactors[factor] ||
        ProtectiveFactors[factor].toLocaleLowerCase(),
    )
    .filter(Boolean);
};

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
  needs = [],
  opportunityDescriptions = [],
  protectiveFactors = [],
  gender,
  geoConfig,
}: GenerateRecommendationProps): string | void => {
  if (!recommendation) return;

  const { possessive, object, salutation, subject } = gender
    ? pronouns[gender]
    : pronouns["UNKNOWN"];
  const isBinaryOrTransMaleOrTransFemaleGender =
    gender && ["MALE", "FEMALE", "TRANS_MALE", "TRANS_FEMALE"].includes(gender);
  const lastName = fullName.split(" ").slice(-1).join(" ");
  const name = isBinaryOrTransMaleOrTransFemaleGender ? lastName : fullName;

  const opportunitiesList = formatListWithAnd(
    opportunityDescriptions,
    "opportunities",
  );
  const formattedProtectiveFactors =
    formatProtectiveFactorsList(protectiveFactors);
  const protectiveFactorsList = formatListWithAnd(
    formattedProtectiveFactors,
    "",
  );

  const hasNeeds = needs.length > 0;
  const hasOpportunities = opportunityDescriptions.length > 0;
  const hasProtectiveFactors = protectiveFactors.length > 0;
  const hasSingleProtectiveFactor = protectiveFactors.length === 1;
  const hasNeedsAndOpportunities = hasNeeds && hasOpportunities;

  const sentenceInfoByLabel = keyBy(
    geoConfig.recommendation.baseOptionsTemplate,
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
    protectiveFactorsList,
    hasNeeds,
    hasOpportunities,
    hasNeedsAndOpportunities,
    hasProtectiveFactors,
    hasSingleProtectiveFactor,
  };

  const generateSummary = geoConfig.recommendation.summaryGenerator;

  if (generateSummary) return generateSummary(props);
};
