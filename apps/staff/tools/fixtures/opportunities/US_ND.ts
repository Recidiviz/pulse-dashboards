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
    earlyTermination: {
      callToAction:
        "Review clients eligible for early termination and download the paperwork to file with the Court.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "INT MEASURE",
          text: "Under active intermediate measure as a result of 1+ violations",
        },
        {
          key: "PENDING CHARGE",
          text: "Has a pending felony or misdemeanor charge",
        },
        { key: "CASE PLAN NC", text: "Has not completed case plan goals" },
        {
          key: "MIN PERIOD NE",
          text: "Minimum mandatory supervision period not expired",
        },
        {
          key: "DOP",
          text: "Being supervised for an offense resulting in the death of a person",
        },
        { key: "SO", text: "Being supervised for a sex offense" },
        {
          key: "FINES/FEES",
          text: "Willful nonpayment of fines / fees despite ability to pay",
        },
        { key: "INC", text: "Incarcerated on another offense" },
        {
          key: "PROS PERM DENIED",
          text: "Prosecutor permanently denied early termination",
        },
        {
          key: "PROS TEMP DENIED",
          text: "Prosecutor temporarily denied early termination and will reconsider",
        },
        {
          key: "SENDING STATE DENIED",
          text: "Sending state denied early termination",
        },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Early Termination",
      dynamicEligibilityText:
        "client[|s] may be eligible for early termination",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "supervisionPastEarlyDischargeDate",
          text: "Early termination date is {{date eligibleDate}}",
          tooltip:
            "Policy requirement: must be passed early termination date (as calculated by DOCSTARS)",
        },
        {
          key: "usNdImpliedValidEarlyTerminationSupervisionLevel",
          text: "Currently on {{lowerCase supervisionLevel}} supervision",
          tooltip:
            "Policy requirement: Currently on diversion, minimum, medium, maximum, IC-in, or IC-out supervision level.",
        },
        {
          key: "usNdImpliedValidEarlyTerminationSentenceType",
          text: "Serving {{lowerCase supervisionType}} sentence",
          tooltip:
            "Policy requirement: Serving a suspended, deferred, or IC-probation sentence.",
        },
        {
          key: "usNdNotInActiveRevocationStatus",
          text: "Not on active revocation status",
          tooltip: "Policy requirement: Not on active revocation status.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "earlyTerminationReferrals",
      hideDenialRevert: true,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [
        {
          key: "supervisionPastEarlyDischargeDate",
          text: "Early termination date (as calculated by DOCSTARS) is within 3 months",
          tooltip:
            "Policy requirement: must be passed early termination date (as calculated by DOCSTARS)",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1eHbSEOjjT9FvxffSbXOYEfOYPJheeu6t/view",
      nonOmsCriteria: [
        {
          text: "Fines, fees and restitution",
          tooltip:
            "Adults under supervision who owe court fines, fees, and restitution to the court will be considered on a case-by-case basis for early termination. The decision primarily will be based on whether the adults under supervision are willfully engaging in nonpayment.\nStaff shall consider reducing outstanding fees, fines, and restitution to a civil judgment at termination time, if deemed eligible, thus allowing an avenue to collect outstanding money after supervision is terminated.",
        },
        {
          text: "Has completed the goals of their case supervision plans",
          tooltip:
            "Adults under supervision must complete the goals of their case supervision plans.",
        },
        {
          text: "Not being supervised for an offense resulting in the death of a person",
          tooltip:
            "Adults under supervision are ineligible for early termination if [...] (they are being supervised for an offense which) [...] involves causing a human being’s death.",
        },
        {
          text: "Not being supervised for a sex offense",
          tooltip:
            "Adults under supervision are ineligible for early termination if [...] (they are being supervised for) [...] any felony sex offense",
        },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      stateCode: "US_ND",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Review clients eligible for early termination and complete the auto-filled paperwork to file with the court.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "earlyTermination",
      zeroGrantsTooltip: null,
    },
    usNdATP: {
      callToAction: "Review residents who may be eligible for ATP",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "Removal", text: "Recently removed from ATP" },
        { key: "Medical", text: "Disqualifying medical condition" },
        { key: "Mental health", text: "Disqualifying mental health condition" },
        {
          key: "Violation",
          text: "Recent community or reentry violations resulting in a return to DOCR custody",
        },
        {
          key: "Victim",
          text: "Active or unresolved concerns in the community, such as victim relationships",
        },
        { key: "MRCC", text: "Must transfer to MRCC before ATP consideration" },
        { key: "Other", text: "Other, please specify reason" },
      ],
      denialText: "Mark Ineligible",
      deniedTabTitle: null,
      displayName: "Adult Transition Program",
      dynamicEligibilityText:
        "resident[|s] may be eligible for the Adult Transition Program (ATP)",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "custodyLevelIsMinimum",
          text: "Currently classified as minimum custody",
          tooltip: "Must be classified as minimum to qualify for ATP",
        },
        {
          key: "usNdIncarcerationWithin1YearOfFtcdOrPrdOrCppRelease",
          text: "Less than 12 months until release or parole review date",
          tooltip:
            "Residents must be within 12 months of release to be eligible for ATP",
        },
        {
          key: "usNdNoDetainersOrWarrants",
          text: "No felony warrants or detainers",
          tooltip:
            "Active felony warrants or detainers disqualify a resident from transfer to ATP",
        },
        {
          key: "usNdNotServingIneligibleOffenseForAtpWorkRelease",
          text: "Eligible offense",
          tooltip:
            "Residents are eligible for ATP unless they are serving a sentence for an AA felony without the opportunity for parole under North Dakota Century Code Section 12.1-20-03 or 12.1-16-01. Ineligible offenses include murder, gross sexual imposition with force, gross sexual imposition, and continuous sexual abuse of a child.",
        },
        {
          key: "usNdWorkReleaseCommitteeRequirements",
          text: "{{#if requiresCommitteeApproval}}The resident is compliant with the Work Release Committee's conditions{{else}}The resident does not require approval through the Work Release Committee{{/if}}",
          tooltip:
            "Adults in custody serving an 85% or Armed Offender Minimum Mandatory Sentence (AOMMS), having registration requirements, or having more than ten years until their maximum release date must be approved through the Work/Education Release Committee before consideration for the Adult Transition Program (ATP). Additionally, people in these circumstances can only start working during the last six months of their sentence and must be free of Level II or III disciplinary reports for six months prior to applying to be eligible.",
        },
        {
          key: "incarceratedAtLeast90Days",
          text: "In custody for at least 90 days",
        },
        {
          key: "incarceratedAtLeast30DaysInSameFacility",
          text: "Incarcerated for at least 30 days in current facility",
        },
        {
          key: "notIncarcerationWithin3MonthsOfFullTermCompletionDate",
          text: "More than 3 months until release or parole review date",
        },
        {
          key: "usNdNoRecentReferralsToMinimumHousing",
          text: "No recent referrals to minimum housing in Elite",
        },
        {
          key: "noEscapeInCurrentIncarceration",
          text: "No escape-related sentences in current incarceration term",
        },
        {
          key: "usNdHasFacilityRestrictions",
          text: "The resident has no alerts preventing them from being transferred to an ATP facility",
          tooltip:
            "Alerts requiring a resident to remain in a specific facility disqualify them from being transferred to an ATP facility.",
        },
        {
          key: "notWithin1MonthOfParoleStartDate",
          text: "More than 1 month until parole start date",
        },
        {
          key: "usNdNotEnrolledInRelevantProgram",
          text: "Not currently enrolled in a core program",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ND-AtpReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 3,
      ineligibleCriteriaCopy: [
        {
          key: "incarceratedAtLeast30DaysInSameFacility",
          text: "Needs {{daysUntil thirtyDaysInSameFacilityDate}} more days in current facility",
        },
        {
          key: "incarceratedAtLeast90Days",
          text: "Needs {{daysUntil eligibleDate}} more days in custody",
        },
        {
          key: "usNdNotEnrolledInRelevantProgram",
          text: "The resident is currently enrolled in a core program",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1eHbSEOjjT9FvxffSbXOYEfOYPJheeu6t/view",
      nonOmsCriteria: [
        {
          text: "Must be compliant with programming requirements",
          tooltip:
            "Compliant with all work, education, and programming\nrequirements",
        },
        {
          text: "Resident must sign ATP Agreement",
          tooltip:
            "Adults in custody must sign the Adult Transition Program Agreement form prior to transfer",
        },
        {
          text: "Must be given medical clearance",
          tooltip:
            "Adults in custody must be given a medical physical and be\ncleared by the appropriate health authority prior to transfer",
        },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Validated by data from Elite",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      stateCode: "US_ND",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This tool helps case managers identify residents who are eligible for a referral to ATP (including FTP or MTP), which provides residential transitional services and a stable foundation for residents as they prepare for release into the community. Case managers should complete a Minimum Housing Referral assessment in Elite for every eligible resident.",
      submittedTabTitle: "Referral Submitted",
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "ATP",
      zeroGrantsTooltip: null,
    },
    usNdTransferToMinFacility: {
      callToAction: "Review clients overdue for minimum housing referral",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "Removal",
          text: "Recently removed from a minimum custody facility",
        },
        { key: "Medical", text: "Disqualifying medical condition" },
        { key: "Mental health", text: "Disqualifying mental health condition" },
        { key: "Separations", text: "Disqualifying separations" },
        { key: "Denial", text: "Recent transfer request denial" },
        { key: "Escape", text: "History of escape (in the last 5 years)" },
        { key: "Rescission", text: "Referral was rescinded/revoked." },
        { key: "Treatment", text: "In or missing treatment." },
        { key: "Other", text: "Other, please specify reason" },
      ],
      denialText: "Mark Ineligible",
      deniedTabTitle: null,
      displayName: "Transfer to a Minimum Security Unit",
      dynamicEligibilityText:
        "resident[|s] [is|are] waiting for a minimum custody housing referral",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "custodyLevelIsMinimum",
          text: "Currently classified as minimum custody",
          tooltip:
            "Residents who are classified as minimum custody but residing in a medium or maximum unit may be eligible for transfer to a minimum unit. Residents in an orientation unit are not eligible for transfer until completion of orientation.",
        },
        {
          key: "usNdNotInMinimumSecurityFacility",
          text: "Not residing in a minimum-security unit",
        },
        {
          key: "incarcerationWithin42MonthsOfFullTermCompletionDate",
          text: "Less than 42 months until release",
        },
        {
          key: "notIncarcerationWithin3MonthsOfFullTermCompletionDate",
          text: "More than 3 months until release",
        },
        {
          key: "usNdNoRecentReferralsToMinimumHousing",
          text: "Has not received a recent minimum housing referral",
        },
        {
          key: "noEscapeInCurrentIncarceration",
          text: "No escape-related sentences in current incarceration term",
        },
        {
          key: "usNdNotEnrolledInRelevantProgram",
          text: "Not currently enrolled in a core program",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ND-TransferToMinFacility",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1eHbSEOjjT9FvxffSbXOYEfOYPJheeu6t/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: "Validated by data from Elite",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 60 },
      stateCode: "US_ND",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This tool helps case managers identify residents who are eligible for transfer to a minimum security unit (MRCC or JRMU). Case managers should complete a Minimum Housing Referral assessment in Elite for every eligible resident.",
      submittedTabTitle: "Referral Submitted",
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "TransferToMinFacility",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
