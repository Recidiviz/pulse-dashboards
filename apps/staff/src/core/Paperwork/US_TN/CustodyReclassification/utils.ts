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

import { formatDate } from "../../../../utils";
import { Resident } from "../../../../WorkflowsStore/Resident";
import { FileGeneratorArgs } from "../../DOCXFormGenerator";

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

  if (
    opportunityType === "usTnInitialClassification2026Policy" ||
    opportunityType === "usTnInitialClassification"
  ) {
    out.currentCustodyLevel = "NOT YET CLASSIFIED";
  } else {
    out.currentCustodyLevel = resident.displayCustodyLevel;
  }

  const justifications: string[] = ["Justification for classification: "];
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
): FileGeneratorArgs {
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
    denialReasons,
  } = formData;

  formContents.residentFullName = resident.displayName;

  formContents.statGen = statusAtHearing === "GEN" ? "X" : " ";
  formContents.statAs = statusAtHearing === "AS" ? "X" : " ";
  formContents.statPc = statusAtHearing === "PC" ? "X" : " ";

  formContents.incY = hasIncompatibles ? "X" : " ";
  formContents.incN = !hasIncompatibles ? "X" : " ";

  formContents.trY = recommendationTransfer ? "X" : " ";
  formContents.trN = !recommendationTransfer ? "X" : " ";

  formContents.photoY = updatedPhotoNeeded ? "X" : " ";
  formContents.photoN = !updatedPhotoNeeded ? "X" : " ";

  formContents.emeY = emergencyContactUpdated ? "X" : " ";
  formContents.emeN = !emergencyContactUpdated ? "X" : " ";

  formContents.apY = inmateAppeal ? "X" : " ";
  formContents.apN = !inmateAppeal ? "X" : " ";

  formContents.recFacAs = recommendationFacilityAssignment ?? "";

  formContents.denialReasons =
    denialReasons && denialReasons.length > 0
      ? denialReasons
      : "___________________________________________________________________________";

  // Add tabs before newlines so the underlining looks right in these big blocks
  (
    [
      "recommendationJustification",
      "disagreementReasons",
      "denialReasons",
    ] as const
  ).forEach((multiLineField) => {
    if (formData[multiLineField])
      formContents[multiLineField] = formData[multiLineField].replace(
        /\n/g,
        "\t\n",
      );
  });

  return [
    `${resident.displayName} - Offender Classification Summary.docx`,
    resident.stateCode,
    "custody_reclassification_cover_sheet.docx",
    { ...formData, ...formContents },
  ];
}
