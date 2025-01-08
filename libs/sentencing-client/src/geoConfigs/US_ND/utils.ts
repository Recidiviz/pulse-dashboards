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
    subject,
    salutation,
    needs,
    opportunitiesList,
    hasNeeds,
    hasOpportunities,
    hasNeedsAndOpportunities,
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
  const isSubjectThey = subject === "they";
  const needWordBasedOnSubject = isSubjectThey ? "need" : "needs";

  const defaultTemplate = `After careful consideration of the details of this case, it is recommended that ${salutation} ${name} ${sentenceLengthRange} with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure ${subject} ${needWordBasedOnSubject} while allowing ${object} to access a variety of community-based resources, including ${opportunitiesList}. These services would support ${salutation} ${name} in addressing ${possessive} key needs, including ${needsList}. Hopefully the defendant will take advantage of the resources available to ${object} and make the changes necessary to set ${possessive} life on a better path.`;

  const noNeedsTemplate = `After careful consideration of the details of this case, it is recommended that ${salutation} ${name} ${sentenceLengthRange} with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure ${subject} ${needWordBasedOnSubject} while allowing ${object} to access a variety of community-based resources, including ${opportunitiesList}. These services would support ${salutation} ${name} in addressing ${possessive} key needs, setting ${object} up for a fresh start. Hopefully the defendant will take advantage of the resources available to ${object} and make the changes necessary to set ${possessive} life on a better path.`;

  const noOpportunitiesTemplate = `After careful consideration of the details of this case, it is recommended that ${salutation} ${name} ${sentenceLengthRange} with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure ${subject} ${needWordBasedOnSubject} while allowing ${object} to access a variety of community-based resources to address ${possessive} key needs, including ${needsList}. Hopefully the defendant will take advantage of the resources available to ${object} and make the changes necessary to set ${possessive} life on a better path.`;

  const noOpportunitiesNoNeedsTemplate = `After careful consideration of the details of this case, it is recommended that ${salutation} ${name} ${sentenceLengthRange} with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure ${subject} ${needWordBasedOnSubject} while allowing ${object} to access a variety of community-based resources to address ${possessive} key needs, setting ${object} up for a fresh start. Hopefully the defendant will take advantage of the resources available to ${object} and make the changes necessary to set ${possessive} life on a better path.`;

  const over21YearRecommendationTemplate = `After careful consideration of the details of this case, it is recommended that ${salutation} ${name} be given a sentence of at least 21 years with the North Dakota Department of Corrections and Rehabilitation. Hopefully the defendant will take advantage of the resources available to ${object} while incarcerated and make the changes necessary to set ${possessive} life on a better path.`;

  const noRecommendationTemplate = `Due to the circumstances of this case, I respectfully decline to make a sentencing recommendation at this time.`;

  if (sentenceLengthStart === 21) {
    return trimExtraSpaces(over21YearRecommendationTemplate);
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
