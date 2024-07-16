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
import { baseUsIdCRCConfig } from "../UsIdCRCOpportunityBase/config";
import { UsIdCRCWorkReleaseOpportunity } from "./UsIdCRCWorkReleaseOpportunity";

export const usIdCRCWorkReleaseConfig: OpportunityConfig<UsIdCRCWorkReleaseOpportunity> =
  {
    ...baseUsIdCRCConfig(),
    systemType: "INCARCERATION",
    stateCode: "US_ID",
    urlSection: "CRCWorkRelease",
    label: "Work-release at Community Reentry Centers",
    featureVariant: "usIdCRC",
    dynamicEligibilityText:
      "resident[|s] may be eligible for work-release at a Community Reentry Center",
    callToAction:
      "Review residents who may be eligible for work-release to a CRC and start their paperwork in ATLAS.",
    subheading:
      "This alert helps staff identify people whose full-term release date has passed so that they can be moved to history in order to right-size caseloads.",
    firestoreCollection: "US_ID-CRCWorkReleaseReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_ID,
    denialReasons: {
      MEDICAL: "Was not approved by an IDOC medical provider",
      PENDING:
        "There are pending felony charges or felony investigations in which the resident is a suspect",
      BEHAVIOR: "Resident has had poor institutional behavior",
      PROGRAM: "Missing required facility programming",
      Other: "Other, please specify a reason",
    },
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
      usIdIncarcerationWithin18MonthsOfFtcdOrTpd: {
        text: "Tentative Parole Date (TPD) within eighteen (18) months OR Full Term Release Date (FTRD) within eighteen (18) months",
        tooltip:
          "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
      },
      usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd: {
        text: "Early Release Date (EPRD) within 18 months AND Full Term Release Date (FTRD) within 15 years",
        tooltip:
          "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
      },
      usIdIncarcerationWithin1YearOfTpdAndLifeSentence: {
        text: "Life sentence AND Tentative Parole Date (TPD) within 1 year",
        tooltip:
          "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
      },
    },
    compareBy: [{ field: "releaseDate" }],
  };
