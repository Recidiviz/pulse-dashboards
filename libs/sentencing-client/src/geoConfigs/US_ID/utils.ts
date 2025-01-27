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
import { OTHER_OPTION } from "../../components/CaseDetails/Form/constants";
import { formatNeedsList } from "../../components/CaseDetails/Recommendations/summaryUtils";
import { SummaryProps } from "../../components/CaseDetails/Recommendations/types";
import { RecommendationType } from "../../components/CaseDetails/types";
import {
  formatListWithAnd,
  formatPossessiveName,
  trimExtraSpaces,
} from "../../utils/utils";

/** Idaho recommendation summary generator */
export const generateIdahoSummary = (props: SummaryProps): string | void => {
  const {
    recommendation,
    name,
    possessive,
    object,
    salutation,
    needs,
    opportunitiesList,
    hasNeeds,
    hasOpportunities,
    hasNeedsAndOpportunities,
  } = props;

  const defaultExclusionList: Case["needsToBeAddressed"] = [
    "ClothingAndToiletries",
    "GeneralReEntrySupport",
    OTHER_OPTION,
  ];
  const riderOrTermExclusionList: Case["needsToBeAddressed"] = [
    "CaseManagement",
    "FamilyServices",
    "FinancialAssistance",
    "FoodInsecurity",
    "HousingOpportunities",
    "JobTrainingOrOpportunities",
    "Transportation",
    ...defaultExclusionList,
  ];
  const needsListExclusions = {
    Rider: riderOrTermExclusionList,
    Term: riderOrTermExclusionList,
    Probation: defaultExclusionList,
    None: defaultExclusionList,
  };
  const formattedNeedsList = formatNeedsList(
    needs,
    needsListExclusions[recommendation as RecommendationType],
  );
  const needsList = formatListWithAnd(formattedNeedsList, "needs", true);

  const probationTemplate = {
    default: `
            After careful consideration of the details of this case, I respectfully recommend that ${salutation} ${name} be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet ${possessive} ${needsList} needs, including ${opportunitiesList}. Should probation be granted, a list of potential resources will be made available to ${salutation} ${formatPossessiveName(name)} supervising officer. Hopefully the defendant will take advantage of the resources available to ${object} while on supervision and make the changes necessary to set ${possessive} life on a better path.
        `,
    noNeeds: `
            After careful consideration of the details of this case, I respectfully recommend that ${salutation} ${name} be sentenced to a period of felony probation. There are a variety of opportunities in the community to support ${object}, including ${opportunitiesList}. Should probation be granted, a list of potential resources will be made available to ${salutation} ${formatPossessiveName(name)} supervising officer. Hopefully the defendant will take advantage of the resources available to ${object} while on supervision and make the changes necessary to set ${possessive} life on a better path.
         `,
    noOpportunities: `
            After careful consideration of the details of this case, I respectfully recommend that ${salutation} ${name} be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet ${possessive} ${needsList} needs, and I hope that the defendant will take advantage of these resources while on supervision and make the changes necessary to set ${possessive} life on a better path.
         `,
    noNeedsNoOpportunities: `
            After careful consideration of the details of this case, I respectfully recommend that ${salutation} ${name} be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet ${possessive} needs, and I hope that the defendant will take advantage of these resources while on supervision and make the changes necessary to set ${possessive} life on a better path.
         `,
  };

  const riderTermNoneTemplates: { [key: string]: string } = {
    Rider: `
          I recommend that ${salutation} ${name} be sentenced to a period of retained jurisdiction where they can address their ${needsList} issues.
       `,
    Term: `
          Due to the circumstances of their case, I respectfully recommend ${salutation} ${name} be sentenced to a period of incarceration under the physical custody of the Idaho Department of Correction where they can address their ${needsList} issues.
       `,
    None: `
          Due to the circumstances of this case, I respectfully decline to make a sentencing recommendation at this time.
       `,
  };

  if (recommendation === RecommendationType.Probation) {
    if (hasNeedsAndOpportunities) {
      return trimExtraSpaces(probationTemplate.default);
    } else if (!hasNeeds && hasOpportunities) {
      return trimExtraSpaces(probationTemplate.noNeeds);
    } else if (hasNeeds && !hasOpportunities) {
      return trimExtraSpaces(probationTemplate.noOpportunities);
    } else {
      return trimExtraSpaces(probationTemplate.noNeedsNoOpportunities);
    }
  } else if (riderTermNoneTemplates[recommendation]) {
    return trimExtraSpaces(riderTermNoneTemplates[recommendation]);
  }
};
