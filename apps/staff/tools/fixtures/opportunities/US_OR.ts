// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { ApiOpportunityConfigurationResponse } from "../../../src/WorkflowsStore/Opportunity/OpportunityConfigurations/interfaces";

export const mockApiOpportunityConfigurationResponse = {
  enabledConfigs: {
    usOrEarnedDischarge: {
      callToAction:
        "Review clients who may be eligible for ED and complete the EDIS checklist.",
      compareBy: null,
      denialReasons: {
        ENHANCEMENTS: "Ineligible crime due to sentencing enhancements",
        "FINES & FEES":
          "Compensatory fines and restitution have not been paid in full or not current on payment plan",
        "COURT VIOLATION":
          "Has been found in violation of the court in the past 6 months",
        PROGRAMMING:
          "Incomplete specialty court programs or treatment programs",
        COMPLIANCE: "Not in compliance with the supervision case plan",
        CONVICTION:
          "Has been convicted a crime that occurred while on supervision for the case under review; not found in the DOC400/CIS",
        Other: "Other: please specify a reason",
      },
      denialText: "Additional Eligibility",
      displayName: "Earned Discharge",
      dynamicEligibilityText:
        "client[|s] on [a|] funded sentence[|s] may be eligible for Earned Discharge from Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        eligibleStatute: {
          text: "On supervision for felony, drug-related, or person misdemeanor Officer must confirm no disqualifying enhancements",
          tooltip:
            "Felony and/or designated drug-related or designated person misdemeanor convictions sentenced to Probation, Local Control Post-Prison Supervision or Board Post-Prison Supervision.",
        },
        pastHalfCompletionOrSixMonths: {
          text: "Has served at least 6 months or half the supervision period",
          tooltip:
            "Served the minimum period of active supervision on the case under consideration (minimum of 6 months or half of the supervision period whichever is greater).",
        },
        noAdministrativeSanction: {
          text: "No administrative sanctions in the past 6 months Officer must confirm no court violations",
          tooltip:
            "Has not been administratively sanctioned, excluding interventions, or found in violation by the court in the immediate six months prior to review.",
        },
        noConvictionDuringSentence: {
          text: "Not convicted of a crime that occurred while on supervision for case under review; found in the DOC400/CIS",
          tooltip:
            "Has not been convicted of a crime (felony or misdemeanor) that occurred while on supervision for the case(s) under review.",
        },
      },
      firestoreCollection: "US_OR-earnedDischarge",
      hideDenialRevert: false,
      homepagePosition: 1,
      ineligibleCriteriaCopy: {},
      initialHeader: null,
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1-V5qxOjurPggO4NrHSRBDB_pn8gmYjoa/view",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 365 },
      stateCode: "US_OR",
      subheading:
        "Early Discharge is the ability to end probation or parole early for clients once they have completed at least 6 months or half the supervision period, and have met all of the criteria outlined in the ODOC’s [official policy](https://secure.sos.state.or.us/oard/displayDivisionRules.action?selectedDivision=999). Review eligible clients and complete the EDIS check-list.",
      systemType: "SUPERVISION",
      tabGroups: null,
      tooltipEligibilityText: "Eligible for early discharge",
      urlSection: "earnedDischarge",
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
