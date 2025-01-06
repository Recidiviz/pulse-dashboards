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

import { ApiOpportunityConfigurationResponse } from "../../../src/WorkflowsStore/Opportunity/OpportunityConfigurations/interfaces";

export const mockApiOpportunityConfigurationResponse = {
  enabledConfigs: {
    usOrEarnedDischarge: {
      callToAction:
        "Review clients who may be eligible for ED and complete the EDIS checklist.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "ENHANCEMENTS",
          text: "Ineligible crime due to sentencing enhancements",
        },
        {
          key: "FINES & FEES",
          text: "Compensatory fines and restitution have not been paid in full or not current on payment plan",
        },
        {
          key: "COURT VIOLATION",
          text: "Has been found in violation of the court in the past 6 months",
        },
        {
          key: "PROGRAMMING",
          text: "Incomplete specialty court programs or treatment programs",
        },
        {
          key: "COMPLIANCE",
          text: "Not in compliance with the supervision case plan",
        },
        {
          key: "CONVICTION",
          text: "Has been convicted a crime that occurred while on supervision for the case under review; not found in the DOC400/CIS",
        },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: "Additional Eligibility",
      deniedTabTitle: null,
      displayName: "Earned Discharge",
      dynamicEligibilityText:
        "client[|s] on [a|] funded sentence[|s] may be eligible for Earned Discharge from Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "eligibleStatute",
          text: "On supervision for felony, drug-related, or person misdemeanor Officer must confirm no disqualifying enhancements",
          tooltip:
            "Felony and/or designated drug-related or designated person misdemeanor convictions sentenced to Probation, Local Control Post-Prison Supervision or Board Post-Prison Supervision.",
        },
        {
          key: "pastHalfCompletionOrSixMonths",
          text: "Has served at least 6 months or half the supervision period",
          tooltip:
            "Served the minimum period of active supervision on the case under consideration (minimum of 6 months or half of the supervision period whichever is greater).",
        },
        {
          key: "noAdministrativeSanction",
          text: "No administrative sanctions in the past 6 months Officer must confirm no court violations",
          tooltip:
            "Has not been administratively sanctioned, excluding interventions, or found in violation by the court in the immediate six months prior to review.",
        },
        {
          key: "noConvictionDuringSentence",
          text: "Not convicted of a crime that occurred while on supervision for case under review; found in the DOC400/CIS",
          tooltip:
            "Has not been convicted of a crime (felony or misdemeanor) that occurred while on supervision for the case(s) under review.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_OR-earnedDischarge",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1-V5qxOjurPggO4NrHSRBDB_pn8gmYjoa/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 365 },
      stateCode: "US_OR",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Early Discharge is the ability to end probation or parole early for clients once they have completed at least 6 months or half the supervision period, and have met all of the criteria outlined in the ODOC’s [official policy](https://secure.sos.state.or.us/oard/displayDivisionRules.action?selectedDivision=999). Review eligible clients and complete the EDIS check-list.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for early discharge",
      urlSection: "earnedDischarge",
      zeroGrantsTooltip: null,
    },
    usOrEarnedDischargeSentence: {
      callToAction: "Review eligible clients and complete the EDIS check-list.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "ENHANCEMENTS",
          text: "Ineligible crime due to sentencing enhancements",
        },
        {
          key: "COURT VIOLATION",
          text: "Has been found in violation of the court in the past 6 months",
        },
        {
          key: "CONVICTION",
          text: "Has been convicted a crime that occurred while on supervision for the case under review (not found in the DOC400/CIS)",
        },
        {
          key: "FINES & FEES",
          text: "Compensatory fines and restitution have not been paid in full or not current on payment plan",
        },
        {
          key: "PROGRAMMING",
          text: "Incomplete specialty court programs or treatment programs",
        },
        {
          key: "COMPLIANCE",
          text: "Not in compliance with the supervision case plan",
        },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Earned Discharge",
      dynamicEligibilityText:
        "client[|s] on [a|] funded sentence[|s] may be eligible for Earned Discharge from Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "eligibleStatute",
          text: "On supervision for a qualifying felony, designated drug-related, or designated person misdemeanor",
          tooltip:
            "Qualifying felony, designated drug-related, or designated person misdemeanor convictions sentenced to Probation or Post-Prison Supervision",
        },
        {
          key: "pastHalfCompletion",
          text: "Has served half of the supervision period",
          tooltip:
            "Served the minimum period of active supervision on the case under consideration (minimum of 6 months or half of the supervision period, whichever is greater)",
        },
        {
          key: "past6Months",
          text: "Has served at least 6 months of active supervision on the case under consideration",
          tooltip:
            "Served the minimum period of active supervision on the case under consideration (minimum of 6 months or half of the supervision period, whichever is greater)",
        },
        {
          key: "usOrNoSupervisionSanctionsWithin6Months",
          text: "No administrative sanctions in the past 6 months",
          tooltip:
            "Has not been administratively sanctioned, excluding interventions, in the immediate 6 months prior to review",
        },
        {
          key: "noConvictionDuringSentence",
          text: "Not convicted of a crime that occurred while on supervision for the case under review",
          tooltip:
            "Has not been convicted of a crime (felony or misdemeanor) that occurred while on supervision for the case under review",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_OR-earnedDischargeSentence",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [
        {
          key: "pastHalfCompletion",
          text: "Within 60 days of serving half the supervision period",
          tooltip:
            "Served the minimum period of active supervision on the case under consideration (minimum of 6 months or half of the supervision period, whichever is greater)",
        },
        {
          key: "past6Months",
          text: "Within 60 days of serving 6 months on supervision",
          tooltip:
            "Served the minimum period of active supervision on the case under consideration (minimum of 6 months or half of the supervision period, whichever is greater)",
        },
        {
          key: "usOrNoSupervisionSanctionsWithin6Months",
          text: "Needs {{monthsOrDaysRemainingFromToday violationExpirationDate}} without an administrative sanction",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1-V5qxOjurPggO4NrHSRBDB_pn8gmYjoa/view",
      nonOmsCriteria: [
        {
          text: "No disqualifying sentence enhancements not entered in DOC400",
          tooltip:
            "Is not on supervision for a sentencing enhancement imposed under the provisions of ORS 161.610, 161.725, 161.735, 164.061, 475.907, 475.925, or 475.930; as well as ORS 137.635 for Probation Burglary I",
        },
        {
          text: "No court violations in the past 6 months",
          tooltip:
            "Has not been found in violation by the court in the immediate 6 months prior to review",
        },
        {
          text: "Not convicted of a crime that occurred while on supervision for the case under review (not found in DOC400/CIS)",
          tooltip:
            "Has not been convicted of a crime (felony or misdemeanor) that occurred while on supervision for the case under review",
        },
        {
          text: "Has fully paid any restitution and compensatory fine or is current on payment plan",
          tooltip:
            "Has either fully paid any restitution and compensatory fine ordered by the court, or established a payment schedule through the court or appropriate supervising authority consistent with ORS 137.106, and is current in their payment obligations",
        },
        {
          text: "Has completed any specialty court programs or treatment programs",
          tooltip:
            "Has completed any specialty court program and treatment programs with set durations or timeframes, and has consistently participated in any ongoing treatment programs",
        },
        {
          text: "In compliance with supervision conditions and case plan",
          tooltip:
            "Is in compliance with conditions of supervision and any applicable supervision case plan",
        },
      ],
      nonOmsCriteriaHeader:
        "Additional Eligibility Requirements Manually Verified",
      notifications: [],
      omsCriteriaHeader: "Eligibility Requirements Verified via DOC400",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_OR",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Earned Discharge is the ability to end probation or parole early for clients once they have completed at least 6 months and half the supervision period, and have met all of the criteria outlined in the ODOC’s official policy.   Review eligible clients and complete the EDIS check-list.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for early discharge",
      urlSection: "earnedDischargeSentence",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
