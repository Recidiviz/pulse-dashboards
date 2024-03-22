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
import { UsMiMinimumTelephoneReportingOpportunity } from "./UsMiMinimumTelephoneReportingOpportunity";

export const usMiMinimumTelephoneReportingConfig: OpportunityConfig<UsMiMinimumTelephoneReportingOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_MI",
    urlSection: "minimumTelephoneReporting",
    label: "Minimum Telephone Reporting",
    dynamicEligibilityText:
      "client[|s] may be eligible for downgrade to a minimum telephone reporting",
    callToAction:
      "Review clients who meet the requirements for minimum telephone reporting and change supervision levels in OMNI.",
    firestoreCollection: "US_MI-minimumTelephoneReporting",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    eligibilityDateText:
      "Earliest Eligibility Date for Minimum Telephone Reporting",
    denialReasons: {
      FIREARM:
        "Serving on a felony offense involving possession or use of a firearm",
      "SPEC COURT":
        "Enrolled in a special issue court (e.g. Drug Treatment Court, Recovery Court, MH Court, Veterans Court)",
      RPOSN:
        "Designated as Reentry Project for Offenders with Special Needs (RPOSN - D-47)",
      "HIGH PROFILE":
        "Currently serving for an offense that resulted in the death of a person or a high-profile case with adverse community reaction (requires Max or higher based on risk score)",
      JUDGE: "County Judge declined client for consideration",
      Other: "Other, please specify a reason",
    },
    sidebarComponents: ["ClientProfileDetails", "EligibilityDate"],
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MI,
    eligibleCriteriaCopy: {
      onMinimumSupervisionAtLeastSixMonths: {
        text: "Served at least six months on Minimum In-Person or Minimum Low Risk supervision",
        tooltip:
          "Offenders assigned to minimum in person or minimum low-risk supervision shall be evaluated for assignment to minimum TRS after they have completed six months of active supervision.",
      },
      usMiSupervisionAndAssessmentLevelEligibleForTelephoneReporting: {
        text: "Original COMPAS score was {{titleCase initialAssessmentLevel}}",
        tooltip:
          "Original COMPAS score was minimum or medium and current supervision level is minimum in person or current supervision level is minimum low risk.",
      },
      usMiNotRequiredToRegisterUnderSora: {
        text: "Not required to register per SORA",
        tooltip:
          "Not currently required to register pursuant to to the Sex Offender Registration Act.",
      },
      usMiNotServingIneligibleOffensesForTelephoneReporting: {
        text: "Not on supervision for an offense excluded from eligibility for telephone reporting",
        tooltip:
          "Not currently serving for an offense listed in WS 01.06.115 Attachment A “Michigan Sex Offender Registry Offenses” or any any similar offense from another state. Not currently serving for an offense included in OP 06.04.130K Attachment A “TRS Exclusion List” including Attempts, Solicitation and Conspiracy. Agents should reference the PACC code on the list when determining eligibility. Not serving for Operating Under the Influence of Liquor (OUIL) or Operating While Impaired (OWI) (any level), unless the offender has successfully completed twelve months of active supervision. A probationer currently serving for OUIL/OWI may only be placed on TRS if authorized by the sentencing court and documented by a court order. Not serving a life or commuted sentence. Not serving a probation term with a delay of sentence.",
      },

      supervisionNotPastFullTermCompletionDateOrUpcoming90Days: {
        text: "More than 90 days remaining until full-term discharge.",
      },
    },
  };
