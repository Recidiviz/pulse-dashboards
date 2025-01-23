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
import { formatListWithAnd, trimExtraSpaces } from "../../utils/utils";

/** Idaho recommendation summary generator */
export const generateIdahoSummary = (props: SummaryProps): string | void => {
  const {
    recommendation,
    name,
    possessive,
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
  const needsList = formatListWithAnd(formattedNeedsList, "", true);

  const factorsWhichSuggestPhrase = hasSingleProtectiveFactor
    ? `suggesting`
    : `factors which suggest`;
  const theseFactorsSuggestPhrase = hasSingleProtectiveFactor
    ? `, suggesting`
    : `. These factors suggest`;
  const protectiveFactorsSentence = hasProtectiveFactors
    ? `${salutation} ${name} has ${protectiveFactorsList}—${factorsWhichSuggestPhrase} a solid foundation for success in the community.`
    : ``;
  const riderTermProtectiveFactorsParagraph = `While incarceration is recommended due to the nature of the offense, ${salutation} ${name} has ${protectiveFactorsList}${theseFactorsSuggestPhrase} a solid foundation that may contribute to ${possessive} successful reintegration into the community upon ${possessive} release.\n\n`;

  const probationTemplate = {
    default: `
            After careful consideration of the details of this case, it is recommended that ${salutation} ${name} be sentenced to a period of felony probation. ${protectiveFactorsSentence}\n\nTo provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address ${possessive} ${needsList} needs while on supervision. A variety of local resources are available to meet these needs, including ${opportunitiesList}.\n\nGiven this support and structure, it is hoped that ${salutation} ${name} will make the changes necessary to build a more stable and productive future.
        `,
    noNeeds: `
            After careful consideration of the details of this case, it is recommended that ${salutation} ${name} be sentenced to a period of felony probation. ${protectiveFactorsSentence}\n\nTo provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address ${possessive} needs while on supervision. A variety of local resources are available to meet these needs, including ${opportunitiesList}.\n\nGiven this support and structure, it is hoped that ${salutation} ${name} will make the changes necessary to build a more stable and productive future.
        `,
    noOpportunities: `
            After careful consideration of the details of this case, it is recommended that ${salutation} ${name} be sentenced to a period of felony probation. ${protectiveFactorsSentence}\n\nTo provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address ${possessive} ${needsList} needs while on supervision.\n\nGiven this support and structure, it is hoped that ${salutation} ${name} will make the changes necessary to build a more stable and productive future.
        `,
    noNeedsNoOpportunities: `
            After careful consideration of the details of this case, it is recommended that ${salutation} ${name} be sentenced to a period of felony probation. ${protectiveFactorsSentence}\n\nTo provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address ${possessive} needs while on supervision.\n\nGiven this support and structure, it is hoped that ${salutation} ${name} will make the changes necessary to build a more stable and productive future.
        `,
  };

  const riderTermNoneTemplates: { [key: string]: string } = {
    Rider: `
          Given the circumstances of this case, it is recommended that ${salutation} ${name} be sentenced to a period of retained jurisdiction.\n\n${
            hasProtectiveFactors ? riderTermProtectiveFactorsParagraph : ``
          }During this time, it is further recommended that a comprehensive plan be developed to address ${possessive} ${needsList} needs. It is hoped that, with this structure and support, ${salutation} ${name} will make the changes necessary to build a more stable and productive future.
       `,
    Term: `
          Given the circumstances of this case, it is recommended that ${salutation} ${name} be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction.\n\n${
            hasProtectiveFactors ? riderTermProtectiveFactorsParagraph : ``
          }During ${possessive} incarceration, it is further recommended that a comprehensive plan be developed to address ${possessive} ${needsList} needs. It is hoped that, with this structure and support, ${salutation} ${name} will make the changes necessary to build a more stable and productive future.
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
