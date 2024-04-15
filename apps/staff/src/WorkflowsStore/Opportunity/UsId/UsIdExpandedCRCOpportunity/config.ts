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
import { UsIdExpandedCRCOpportunity } from "./UsIdExpandedCRCOpportunity";

export const usIdExpandedCRCConfig: OpportunityConfig<UsIdExpandedCRCOpportunity> =
  {
    systemType: "INCARCERATION",
    stateCode: "US_ID",
    urlSection: "expandedCRC",
    label: "Expanded CRC Program",
    featureVariant: "usIdExpandedCRC",
    dynamicEligibilityText:
      "resident[|s] [is|are] eligible for transfer to Expanded Community Reentry Centers.",
    callToAction:
      "Review clients who may be eligible for a transfer to XCRC and start their paperwork in ATLAS.",
    firestoreCollection: "US_ID-expandedCRCReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 30,
    },
    denialReasons: {
      MEDICAL: "Was not approved by an IDOC medical provider",
      PENDING:
        "There are pending felony charges or felony investigations in which the resident is a suspect",
      BEHAVIOR: "Resident has had poor institutional behavior",
      PROGRAM: "Missing required facility programming",
      TRUST: "Resident does not have $500.00 in their resident trust account",
      EMPLOYMENT:
        "Resident is not currently employed full-time or engaged in or accepted to a full-time " +
        "Idaho educational program approved by the IDOC",
      CLASS_A_OR_B:
        "Has class A or B disciplinary reports in the past six months",
      Other: "Other, please specify a reason",
    },
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_ID,
    sidebarComponents: ["Incarceration", "UsIdPastTwoYearsAlert", "CaseNotes"],
    eligibleCriteriaCopy: {
      custodyLevelIsMinimum: {
        text: "Currently on Minimum custody",
        tooltip:
          "Shall be institutionally classified as minimum custody and cannot receive a classification override",
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

      usIdIncarcerationWithin6MonthsOfFtcdOrPedOrTpd: {
        text: "Is within 6 months of release",
        tooltip:
          "Shall be within six months of release (generally calculated from the parole eligibility date, " +
          "full-term release, or tentative parole date). Those who are past their parole eligibility date " +
          "or within six months of a tentative parole date may also be considered, on a case by case basis",
      },

      usIdInCrcFacilityOrPwccUnit1For60Days: {
        text: "Served at least 60 days at current facility",
        tooltip:
          "Shall have resided in a CRC or minimum custody employment release program " +
          "(such as PWCC’s Unit 1) for a minimum of 60 days",
      },

      usIdInCrcFacilityOrPwccUnit1: {
        text: "Resident in {{facilityName}} since {{date crcStartDate}}",
      },
    },
    compareBy: [{ field: "releaseDate" }],
  };
