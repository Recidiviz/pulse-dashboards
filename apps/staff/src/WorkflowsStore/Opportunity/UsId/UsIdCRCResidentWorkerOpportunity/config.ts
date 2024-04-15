// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsIdCRCResidentWorkerOpportunity } from "./UsIdCRCResidentWorkerOpportunity";

export const usIdCRCResidentWorkerConfig: OpportunityConfig<UsIdCRCResidentWorkerOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_ID",
    urlSection: "CRCResidentWorker",
    label: "Resident worker at Community Reentry Centers",
    featureVariant: "usIdCRC",
    dynamicEligibilityText:
      "resident[|s] may be eligible to be a resident worker at a Community Reentry Center",
    callToAction:
      "Review residents who may be eligbile for transfer to a CRC and start their paperwork in ATLAS.",
    firestoreCollection: "US_ID-CRCResidentWorkerReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    denialReasons: {
      MEDICAL: "Was not approved by an IDOC medical provider",
      PENDING:
        "There are pending felony charges or felony investigations in which the resident is a suspect",
      BEHAVIOR: "Resident has had poor institutional behavior",
      PROGRAM: "Missing required facility programming",
      Other: "Other, please specify a reason",
    },
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_ID,
    sidebarComponents: ["Incarceration", "UsIdPastTwoYearsAlert", "CaseNotes"],
    eligibleCriteriaCopy: {
      custodyLevelIsMinimum: {
        text: "Currently on Minimum custody",
      },
      notServingForSexualOffense: {
        text: "Not serving for a sexual offense",
      },
      usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: {
        text: "No escape attempts in the last 10 years",
        tooltip:
          "No escape, eluding police, or absconsion offense(s) in the last 10 years",
      },
      usIdNoDetainersForXcrcAndCrc: {
        text: "No active felony detainers or holds",
        tooltip: "Cannot have any felony detainers or holds",
      },
      usIdIncarcerationWithin7YearsOfFtcdOrTpd: {
        text: "Tentative Parole Date (TPD) within seven (7) years OR Full Term Release Date (FTRD) within seven (7) years",
        tooltip:
          "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
      },
      usIdIncarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd: {
        text: "Parole Eligibility Date (PED) within seven (7) years AND Parole Hearing Date (PHD) within seven (7) years AND Full Term Release Date (FTRD) within 20 years",
        tooltip:
          "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
      },
      usIdIncarcerationWithin3YearsOfTpdAndLifeSentence: {
        text: "Life sentence AND Tentative Parole Date (TPD) within 3 years",
        tooltip:
          "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
      },
    },
    compareBy: [{ field: "releaseDate" }],
  };
