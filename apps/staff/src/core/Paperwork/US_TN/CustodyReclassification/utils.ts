// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { uniq } from "lodash";

import {
  CoverSheetFormData,
  OpportunityType,
  UsTnCoverSheetSharedDraftData,
} from "~datatypes";
import { formatDate } from "~utils";

import { PartialRecord } from "../../../../utils/typeUtils";
import { Resident } from "../../../../WorkflowsStore/Resident";
import { DocxTemplateFormContents } from "../../DOCXFormGenerator";

export const CLASSIFICATION_TYPE_BY_OPPORTUNITY: PartialRecord<
  OpportunityType,
  string
> = {
  usTnInitialClassification2026Policy: "Diagnostic Classification",
  usTnAnnualReclassification2026Policy: "Annual Reclassification",
  usTnSpecialCustodyLevelUpgrade2026Policy:
    "Special Reclassification: Upgrade Due to Updated CAF Scoring",
  usTnSeriousMisconductUpgrade:
    "Special Reclassification: Upgrade for Serious Misconduct",
  usTnTrusteeTransfer:
    "Special Reclassification: Transfer to Trustee or Transition Center",
  usTnCustodyLevelDowngrade2026Policy: "Special Reclassification: Downgrade",
  usTnBiannualOther: "Bi-annual/Other",
};

export function prefilledCoverSheetData(
  resident: Resident,
  opportunityType: OpportunityType,
  formInformation: CoverSheetFormData,
): Partial<UsTnCoverSheetSharedDraftData> {
  const out: Partial<UsTnCoverSheetSharedDraftData> = {
    residentFullName: resident.displayName,
    omsId: resident.externalId,
    institutionName: resident.facilityId,
    recommendationFacilityAssignment: resident.facilityId,
    date: formatDate(new Date()),
  };

  out.statusAtHearing = formInformation.statusAtHearingSeg;
  out.hasIncompatibles = formInformation.hasIncompatibles;
  out.incompatiblesList = formInformation.incompatibleArray
    ?.map(({ incompatibleOffenderId }) => incompatibleOffenderId)
    .join(", ");

  if (opportunityType in CLASSIFICATION_TYPE_BY_OPPORTUNITY) {
    out.classificationType =
      CLASSIFICATION_TYPE_BY_OPPORTUNITY[opportunityType];
  }

  if (
    opportunityType === "usTnInitialClassification2026Policy" ||
    opportunityType === "usTnInitialClassification"
  ) {
    out.currentCustodyLevel = "NOT YET CLASSIFIED";
  } else {
    out.currentCustodyLevel = resident.displayCustodyLevel;
  }

  const justifications: string[] = [];
  if (formInformation.sentenceExpirationDate) {
    justifications.push(
      `Release Date: ${formatDate(formInformation.sentenceExpirationDate)}`,
    );
  }
  if (formInformation.sentenceReleaseEligibilityDate) {
    justifications.push(
      `RED Date: ${formatDate(formInformation.sentenceReleaseEligibilityDate)}`,
    );
  }
  if (formInformation.healthClassification) {
    justifications.push(
      `Medical Classification: ${formInformation.healthClassification}`,
    );
  }
  if (formInformation.levelOfCare) {
    justifications.push(`Level of Care: ${formInformation.levelOfCare}`);
  }
  if (formInformation.latestVantageRiskLevel) {
    justifications.push(
      `Latest Vantage Risk Assessment: ${formInformation.latestVantageRiskLevel}`,
    );
  }
  if (formInformation.latestVantageCompletedDate) {
    justifications.push(
      `Latest Vantage Risk Assessment Date: ${formatDate(
        formInformation.latestVantageCompletedDate,
      )}`,
    );
  }
  if (
    formInformation.activeRecommendations &&
    formInformation.activeRecommendations.length
  ) {
    justifications.push(
      `Active Recommendations: ${uniq(
        formInformation.activeRecommendations.map(
          ({ Recommendation }) => Recommendation,
        ),
      ).join(", ")}`,
    );
  }

  out.recommendationJustification = justifications.join("\n");

  return out;
}

export function getCoverSheetTemplateArgs(
  resident: Resident,
  formData: Partial<UsTnCoverSheetSharedDraftData>,
): DocxTemplateFormContents {
  const formContents: Record<string, string> = {};

  const now = new Date();

  formContents.downloadDate = now.toLocaleDateString();
  formContents.downloadTime = now.toLocaleTimeString();

  const {
    statusAtHearing,
    hasIncompatibles,
    recommendationFacilityAssignment,
    recommendationTransfer,
    updatedPhotoNeeded,
    emergencyContactUpdated,
    inmateAppeal,
    finalizingCounselor,
    finalApprovalDate,
    checklistCompletedOnOverride,
    counselorRecommendedOverride,
    counselorRecommendedCustody,
    isServingLife,
    trusteeNotConvictedOfFirstDegreeMurder,
    trusteeHas10YearsOrLessRemaining,
    trusteeNotServingForSexualOffense,
  } = formData;

  formContents.residentFullName = resident.displayName;

  formContents.statGen = statusAtHearing === "GEN" ? "X" : " ";
  formContents.statAs = statusAtHearing === "AS" ? "X" : " ";
  formContents.statPc = statusAtHearing === "PC" ? "X" : " ";

  formContents.incY = hasIncompatibles ? "X" : " ";
  formContents.incN = hasIncompatibles === false ? "X" : " ";

  formContents.trY = recommendationTransfer ? "X" : " ";
  formContents.trN = recommendationTransfer === false ? "X" : " ";

  formContents.photoY = updatedPhotoNeeded ? "X" : " ";
  formContents.photoN = updatedPhotoNeeded === false ? "X" : " ";

  formContents.emeY = emergencyContactUpdated ? "X" : " ";
  formContents.emeN = emergencyContactUpdated === false ? "X" : " ";

  formContents.apY = inmateAppeal ? "X" : " ";
  formContents.apN = inmateAppeal === false ? " X " : "_";

  formContents.recFacAs = recommendationFacilityAssignment ?? "";

  formContents.finalizingCounselor = finalizingCounselor ?? "__________";
  formContents.finAppDate = finalApprovalDate ?? "_______";

  formContents.counselorOverride = counselorRecommendedOverride ?? "     ";
  formContents.counselorLevel = counselorRecommendedCustody ?? "     ";

  formContents.ccY = checklistCompletedOnOverride === "Y" ? "_X_" : "___";
  formContents.ccN = checklistCompletedOnOverride === "N" ? "_X_" : "___";
  formContents.ccNA = checklistCompletedOnOverride === "NA" ? "_X_" : "___";

  [formContents.pq1Y, formContents.pq1N] = coverSheetTFFields(
    trusteeNotConvictedOfFirstDegreeMurder,
  );

  [formContents.pq2Y, formContents.pq2N] = coverSheetTFFields(
    isServingLife,
    false,
  );

  [formContents.pq3Y, formContents.pq3N] = coverSheetTFFields(
    trusteeHas10YearsOrLessRemaining,
  );

  [formContents.pq4Y, formContents.pq4N] = coverSheetTFFields(
    trusteeNotServingForSexualOffense,
  );

  // Add tabs before newlines so the underlining looks right in these big blocks
  (
    [
      "recommendationJustification",
      "disagreementReasons",
      "denialReasons",
    ] as const
  ).forEach((multiLineField) => {
    const outputField = `${multiLineField}OneLine`;
    if (formData[multiLineField]) {
      formContents[outputField] = formData[multiLineField].replace(/\n/g, "; ");
    } else {
      if (multiLineField === "denialReasons") {
        formContents[outputField] =
          "_________________________________________________________________________________________";
      } else {
        formContents[outputField] = "\t";
      }
    }
  });

  return { ...formData, ...formContents };
}

function coverSheetTFFields(
  fieldValue: string | undefined,
  invert = true,
): [string, string] {
  if (invert) {
    return [
      fieldValue === "false" ? "_X_" : "___",
      fieldValue === "true" ? "_X_" : "___",
    ];
  }

  return [
    fieldValue === "true" ? "_X_" : "___",
    fieldValue === "false" ? "_X_" : "___",
  ];
}
