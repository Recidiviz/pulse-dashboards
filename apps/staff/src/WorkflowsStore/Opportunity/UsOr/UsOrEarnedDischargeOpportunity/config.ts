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
import { UsOrEarnedDischargeOpportunity } from "./UsOrEarnedDischargeOpportunity";

export const usOrEarnedDischargeConfig: OpportunityConfig<UsOrEarnedDischargeOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_OR",
    urlSection: "earnedDischarge",
    label: "Earned Discharge",
    dynamicEligibilityText:
      "client[|s] on [a|] funded sentence[|s] may be eligible for Earned Discharge from Supervision",
    callToAction:
      "Review clients who may be eligible for ED and complete the EDIS checklist.",
    firestoreCollection: "US_OR-earnedDischarge",
    denialButtonText: "Additional Eligibility",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 180,
    },
    sidebarComponents: ["ClientProfileDetails"],
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_OR,
    tooltipEligibilityText: "Eligible for early discharge",
    denialReasons: {
      FINES:
        "Compensatory fines and restitution have not been paid in full or not current on payment plan",
      PROGRAMS: "Incomplete specialty court programs or treatment programs",
      "CASE PLAN": "Not in compliance with supervision case plan",
      Other: "Other: please specify a reason",
    },
    eligibleCriteriaCopy: {
      eligibleStatute: {
        text: "Currently serving for a felony or misdemeanor that is eligible for EDIS",
        tooltip:
          "Felony and/or designated drug-related or person misdemeanor convictions sentenced to Probation, Local Control Post-Prison Supervision or Board Post-Prison Supervision",
      },
      pastHalfCompletionOrSixMonths: {
        text: "Has served at least 6 months or half the supervision period",
        tooltip:
          "Served the minimum period of active supervision on the case under consideration (minimum of 6 months or half of the supervision period whichever is greater)",
      },
      noAdministrativeSanction: {
        text: "No administrative sanctions and has not been found in violation of the court in the past 6 months",
        tooltip:
          "Has not been administratively sanctioned or found in violation by the court in the immediate six months prior to review",
      },
      noConvictionDuringSentence: {
        text: "Not convicted of a crime that occurred while on supervision for the case under review",
        tooltip:
          "Has not been convicted of a crime (felony or misdemeanor) that occurred while on supervision for the case(s) under review.",
      },
    },
  };
