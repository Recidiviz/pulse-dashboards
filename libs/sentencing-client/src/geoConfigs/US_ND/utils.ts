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
import { RecommendationType } from "../../components/CaseDetails/types";
import { formatListWithAnd, trimExtraSpaces } from "../../utils/utils";

const sentenceLengthRangeText = (
  sentenceLengthStart?: number,
  sentenceLengthEnd?: number,
) => {
  if (!sentenceLengthStart && !sentenceLengthEnd) {
    return `be sentenced to a period of incarceration`;
  }
  if (sentenceLengthStart === 0 && sentenceLengthEnd === 1) {
    return "be sentenced to a period of incarceration of less than one year";
  }
  return `be sentenced to a period of incarceration between ${sentenceLengthStart} and ${sentenceLengthEnd} years`;
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

  const probationExclusionList: Case["needsToBeAddressed"] = [
    "ClothingAndToiletries",
    "GeneralReEntrySupport",
    OTHER_OPTION,
  ];

  const defaultExclusionList: Case["needsToBeAddressed"] = [
    "CaseManagement",
    "FoodInsecurity",
    "Transportation",
    ...probationExclusionList,
  ];

  const needsListExclusions =
    recommendation === RecommendationType.Probation
      ? probationExclusionList
      : defaultExclusionList;

  const formattedNeedsList = formatNeedsList(needs, needsListExclusions);
  const needsList = formatListWithAnd(formattedNeedsList, "needs", true);
  const sentenceLengthRange = sentenceLengthRangeText(
    sentenceLengthStart,
    sentenceLengthEnd,
  );

  const introSentence = `After careful consideration of the details of this case, it is recommended that ${salutation} ${name} ${sentenceLengthRange} with the North Dakota Department of Corrections and Rehabilitation.`;
  const theseFactorsSuggestPhrase = hasSingleProtectiveFactor
    ? `, suggesting`
    : `. These factors suggest`;
  const protectiveFactorsIntroPhrase =
    recommendation === RecommendationType.Probation
      ? ``
      : `While incarceration is recommended due to the nature of the offense, `;
  const protectiveFactorsEndPhrase =
    recommendation === RecommendationType.Probation
      ? `for success in the community.`
      : `that may contribute to ${possessive} successful reintegration into the community upon ${possessive} release.`;
  const protectiveFactorsSentence = hasProtectiveFactors
    ? `${protectiveFactorsIntroPhrase}${salutation} ${name} ${protectiveFactorsList}${theseFactorsSuggestPhrase} a solid foundation ${protectiveFactorsEndPhrase}\n\n`
    : ``;
  const conclusionSentence = `\n\nShould the defendant be eligible, it is recommended that the Court consider a period of supervised probation after incarceration in order to provide the structure needed to hold ${salutation} ${name} accountable to desist from additional criminal behavior, help ${object} access resources, and support ${object} in making the changes necessary to build a more stable and productive future.`;

  // Templates

  const defaultTemplate = `${introSentence}\n\n${protectiveFactorsSentence}During this time, it is further recommended that a comprehensive plan be developed to address ${possessive} ${needsList} needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support ${possessive} eventual transition, such as ${opportunitiesList}.${conclusionSentence}`;

  const noNeedsTemplate = `${introSentence}\n\n${protectiveFactorsSentence}During this time, it is further recommended that a comprehensive plan be developed to address ${possessive} needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support ${possessive} eventual transition, such as ${opportunitiesList}.${conclusionSentence}`;

  const noOpportunitiesTemplate = `${introSentence}\n\n${protectiveFactorsSentence}During this time, it is further recommended that a comprehensive plan be developed to address ${possessive} ${needsList} needs, both while incarcerated and in preparation for reentry.${conclusionSentence}`;

  const noOpportunitiesNoNeedsTemplate = `${introSentence}\n\n${protectiveFactorsSentence}During this time, it is further recommended that a comprehensive plan be developed to address ${possessive} needs, both while incarcerated and in preparation for reentry.${conclusionSentence}`;

  const overSixYearRecommendationTemplate = `After careful consideration of the details of this case, it is recommended that ${salutation} ${name} be given a sentence of at least 6 years with the North Dakota Department of Corrections and Rehabilitation.${conclusionSentence}`;

  const probationRecommendationTemplate = `After careful consideration of the details of this case, it is recommended that ${salutation} ${name} be sentenced to a period of supervised probation.\n\n${protectiveFactorsSentence}To provide a clear path forward, it is further recommended that a comprehensive plan be developed to address ${possessive} ${needsList}${hasNeeds ? ` needs` : ``} while on supervision.${hasOpportunities ? ` A variety of local resources are available to meet ${possessive} needs, such as ${opportunitiesList}.` : ``}\n\nGiven this support and structure, it is hoped that ${salutation} ${name} will make the changes necessary to build a more stable and productive future.`;

  const noRecommendationTemplate = `Due to the circumstances of this case, I respectfully decline to make a sentencing recommendation at this time.`;

  if (recommendation === RecommendationType.Probation) {
    return trimExtraSpaces(probationRecommendationTemplate);
  }

  if (sentenceLengthStart === 6) {
    return trimExtraSpaces(overSixYearRecommendationTemplate);
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
