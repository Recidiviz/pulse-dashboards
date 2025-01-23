// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Case } from "../../api";
import {
  NONE_OPTION,
  OTHER_OPTION,
} from "../../components/CaseDetails/Form/constants";
import { formatNeedsList } from "../../components/CaseDetails/Recommendations/summaryUtils";
import { SummaryProps } from "../../components/CaseDetails/Recommendations/types";
import { formatListWithAnd, trimExtraSpaces } from "../../utils/utils";

const sentenceLengthRangeText = (
  sentenceLengthStart?: number,
  sentenceLengthEnd?: number,
) => {
  if (!sentenceLengthStart && !sentenceLengthEnd) {
    return `be sentenced to a period of incarceration`;
  }
  if (sentenceLengthStart === 0 && sentenceLengthEnd === 1) {
    return "be given a sentence of less than one year";
  }
  return `be given a sentence between ${sentenceLengthStart} and ${sentenceLengthEnd} years`;
};

/** North Dakota recommendation summary generator */
export const generateNorthDakotaSummary = (
  props: SummaryProps,
): string | void => {
  const {
    recommendation,
    sentenceLengthStart,
    sentenceLengthEnd,
    name,
    possessive,
    object,
    salutation,
    needs,
    opportunitiesList,
    protectiveFactorsList,
    hasNeeds,
    hasOpportunities,
    hasNeedsAndOpportunities,
    hasProtectiveFactors,
    hasSingleProtectiveFactor,
  } = props;

  const needsListExclusions: Case["needsToBeAddressed"] = [
    "CaseManagement",
    "ClothingAndToiletries",
    "FoodInsecurity",
    "Transportation",
    OTHER_OPTION,
  ];
  const formattedNeedsList = formatNeedsList(needs, needsListExclusions);
  const needsList = formatListWithAnd(formattedNeedsList, "needs", true);
  const sentenceLengthRange = sentenceLengthRangeText(
    sentenceLengthStart,
    sentenceLengthEnd,
  );

  const introSentence = `After careful consideration of the details of this case, it is recommended that ${salutation} ${name} ${sentenceLengthRange} with the North Dakota Department of Corrections and Rehabilitation${recommendation === OTHER_OPTION ? `.` : `, followed by a period of supervised probation.`}`;
  const theseFactorsSuggestPhrase = hasSingleProtectiveFactor
    ? `, suggesting`
    : `. These factors suggest`;
  const protectiveFactorsSentence = hasProtectiveFactors
    ? `While incarceration is recommended due to the nature of the offense, ${salutation} ${name} has ${protectiveFactorsList}${theseFactorsSuggestPhrase} a solid foundation that may contribute to ${possessive} successful reintegration into the community upon ${possessive} release.\n\n`
    : ``;

  const defaultTemplate = `${introSentence}\n\n${protectiveFactorsSentence}During this time, it is further recommended that a comprehensive plan be developed to address ${possessive} ${needsList} needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support ${possessive} eventual transition, such as ${opportunitiesList}.\n\nGiven this support and structure, it is hoped that ${salutation} ${name} will make the changes necessary to build a more stable and productive future.`;

  const noNeedsTemplate = `${introSentence}\n\n${protectiveFactorsSentence}During this time, it is further recommended that a comprehensive plan be developed to address ${possessive} needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support ${possessive} eventual transition, such as ${opportunitiesList}.\n\nGiven this support and structure, it is hoped that ${salutation} ${name} will make the changes necessary to build a more stable and productive future.`;

  const noOpportunitiesTemplate = `${introSentence}\n\n${protectiveFactorsSentence}During this time, it is further recommended that a comprehensive plan be developed to address ${possessive} ${needsList} needs, both while incarcerated and in preparation for reentry.\n\nGiven this support and structure, it is hoped that ${salutation} ${name} will make the changes necessary to build a more stable and productive future.`;

  const noOpportunitiesNoNeedsTemplate = `${introSentence}\n\n${protectiveFactorsSentence}During this time, it is further recommended that a comprehensive plan be developed to address ${possessive} needs, both while incarcerated and in preparation for reentry.\n\nGiven this support and structure, it is hoped that ${salutation} ${name} will make the changes necessary to build a more stable and productive future.`;

  const over21YearRecommendationTemplate = `After careful consideration of the details of this case, it is recommended that ${salutation} ${name} be given a sentence of at least 21 years with the North Dakota Department of Corrections and Rehabilitation. Hopefully the defendant will take advantage of the resources available to ${object} while incarcerated and make the changes necessary to set ${possessive} life on a better path.`;

  const noRecommendationTemplate = `Due to the circumstances of this case, I respectfully decline to make a sentencing recommendation at this time.`;

  if (sentenceLengthStart === 21) {
    return trimExtraSpaces(over21YearRecommendationTemplate);
  }

  if (recommendation === NONE_OPTION) {
    return noRecommendationTemplate;
  }

  if (recommendation === NONE_OPTION) {
    return noRecommendationTemplate;
  }

  if (hasNeedsAndOpportunities) {
    return trimExtraSpaces(defaultTemplate);
  }

  if (!hasNeeds && hasOpportunities) {
    return trimExtraSpaces(noNeedsTemplate);
  }

  if (hasNeeds && !hasOpportunities) {
    return trimExtraSpaces(noOpportunitiesTemplate);
  }

  return trimExtraSpaces(noOpportunitiesNoNeedsTemplate);
};
