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

export const mockApiOpportunityConfigurationResponse: ApiOpportunityConfigurationResponse =
  {
    enabledConfigs: {
      earlyTermination: {
        callToAction:
          "Review clients eligible for early termination and download the paperwork to file with the Court.",
        compareBy: null,
        denialReasons: {
          "CASE PLAN NC": "Has not completed case plan goals",
          DOP: "Being supervised for an offense resulting in the death of a person",
          "FINES/FEES":
            "Willful nonpayment of fines / fees despite ability to pay",
          INC: "Incarcerated on another offense",
          "INT MEASURE":
            "Under active intermediate measure as a result of 1+ violations",
          "MIN PERIOD NE": "Minimum mandatory supervision period not expired",
          "PENDING CHARGE": "Has a pending felony or misdemeanor charge",
          "PROS PERM DENIED": "Prosecutor permanently denied early termination",
          "PROS TEMP DENIED":
            "Prosecutor temporarily denied early termination and will reconsider",
          "SENDING STATE DENIED": "Sending state denied early termination",
        },
        denialText: null,
        displayName: "Early Termination",
        dynamicEligibilityText:
          "client[|s] may be eligible for early termination",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          supervisionPastEarlyDischargeDate: {
            text: "Early termination date is {{date eligibleDate}}",
            tooltip:
              "Policy requirement: Early termination date (as calculated by DOCSTARS) has passed or is within 30 days.",
          },
          usNdImpliedValidEarlyTerminationSentenceType: {
            text: "Serving {{lowerCase supervisionType}} sentence",
            tooltip:
              "Policy requirement: Serving a suspended, deferred, or IC-probation sentence.",
          },
          usNdImpliedValidEarlyTerminationSupervisionLevel: {
            text: "Currently on {{lowerCase supervisionLevel}} supervision",
            tooltip:
              "Policy requirement: Currently on diversion, minimum, medium, maximum, IC-in, or IC-out supervision level.",
          },
          usNdNotInActiveRevocationStatus: {
            text: "Not on active revocation status",
            tooltip: "Policy requirement: Not on active revocation status.",
          },
        },
        firestoreCollection: "earlyTerminationReferrals",
        hideDenialRevert: true,
        homepagePosition: 1,
        ineligibleCriteriaCopy: {
          supervisionPastEarlyDischargeDate: {
            text: "Early termination date (as calculated by DOCSTARS) is within 60 days",
            tooltip:
              "Policy requirement: Early termination date (as calculated by DOCSTARS) has passed or is within 30 days.",
          },
        },
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1eHbSEOjjT9FvxffSbXOYEfOYPJheeu6t/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: ["ClientProfileDetails"],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
        stateCode: "US_ND",
        subheading:
          "This alert helps staff identify residents who are due for annual custody reclassification and directs staff to complete & submit new classification paperwork. Review clients eligible for early termination and complete the auto-filled paperwork to file with the court.",
        systemType: "SUPERVISION",
        tabGroups: null,
        tooltipEligibilityText: null,
        urlSection: "earlyTermination",
      },
      usNdATP: {
        callToAction: "Review residents who may be eligible for ATP",
        compareBy: null,
        denialReasons: {
          ASSESSED: "This person has had an assessment completed in Elite.",
        },
        denialText: "Update List",
        displayName: "Adult Transition Program",
        dynamicEligibilityText:
          "resident[|s] may be eligible for the Adult Transition Program (ATP)",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          custodyLevelIsMinimum: {
            text: "Currently classified as minimum custody",
          },
          incarceratedAtLeast30DaysInSameFacility: {
            text: "Incarcerated for at least 30 days in current facility",
          },
          incarceratedAtLeast90Days: {
            text: "In custody for at least 90 days",
          },
          usNdIncarcerationWithin1YearOfFtcdOrPrdOrCppRelease: {
            text: "Less than 12 months until release or parole review date",
          },
          usNdNoDetainersOrWarrants: {
            text: "No felony warrants or detainers",
          },
          usNdNotServingIneligibleOffenseForAtpWorkRelease: {
            text: "Eligible offense",
            tooltip:
              "Residents are eligible for ATP unless they are serving a sentence for an AA felony without the opportunity for parole under North Dakota Century Code Section 12.1-20-03 or 12.1-16-01. Ineligible offenses include murder, gross sexual imposition with force, gross sexual imposition, and continuous sexual abuse of a child.",
          },
          usNdWorkReleaseCommitteeRequirements: {
            text: "{{#if requiresCommitteeApproval}}The resident is compliant with the Work Release Committee's conditions{{else}}The resident does not require approval through the Work Release Committee{{/if}}",
            tooltip:
              "Adults in custody serving an 85% or Armed Offender Minimum Mandatory Sentence (AOMMS), having registration requirements, or having more than ten years until their maximum release date must be approved through the Work/Education Release Committee before consideration for the Adult Transition Program (ATP). Additionally, people in these circumstances can only start working during the last six months of their sentence and must be free of Level II or III disciplinary reports for six months prior to applying to be eligible.",
          },
        },
        firestoreCollection: "US_ND-AtpReferrals",
        hideDenialRevert: false,
        homepagePosition: 3,
        ineligibleCriteriaCopy: {
          incarceratedAtLeast30DaysInSameFacility: {
            text: "Needs {{daysUntil thirtyDaysInSameFacilityDate}} more days in current facility",
          },
          incarceratedAtLeast90Days: {
            text: "Needs {{daysUntil eligibleDate}} more days in custody",
          },
          usNdWorkReleaseCommitteeRequirements: {
            text: "This resident has a Level II/III disciplinary report in the last six months",
          },
        },
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1eHbSEOjjT9FvxffSbXOYEfOYPJheeu6t/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: ["Incarceration", "CaseNotes"],
        snooze: {
          autoSnoozeParams: { params: { days: 3 }, type: "snoozeDays" },
        },
        stateCode: "US_ND",
        subheading:
          "This helps staff identify residents who are eligible for a referral to ATP, which provides residential transitional services and a stable foundation for residents as they prepare for release into the community. Staff are directed to complete a Minimum Housing Referral assessment within Elite for every resident.",
        systemType: "INCARCERATION",
        tabGroups: null,
        tooltipEligibilityText: null,
        urlSection: "ATP",
      },
      usNdTransferToMinFacility: {
        callToAction: "Review clients overdue for minimum housing referral",
        compareBy: null,
        denialReasons: {
          ASSESSED:
            "Minimum housing referral assessment completed for this resident in Elite",
        },
        denialText: "Update List",
        displayName: "Transfer to a Minimum Security Unit",
        dynamicEligibilityText:
          "resident[|s] [is|are] waiting for a minimum custody housing referral",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          custodyLevelIsMinimum: {
            text: "Currently classified as minimum custody",
            tooltip:
              "Residents who are classified as minimum custody but residing in a medium or maximum unit may be eligible for transfer to a minimum unit. Residents in an orientation unit are not eligible for transfer until completion of orientation.",
          },
          incarcerationWithin42MonthsOfFullTermCompletionDate: {
            text: "Less than 42 months until release",
          },
          notIncarcerationWithin3MonthsOfFullTermCompletionDate: {
            text: "More than 3 months until release",
          },
          usNdNotInAnOrientationUnit: {
            text: "Has not received a recent minimum housing referral",
          },
          usNdNotInMinimumSecurityFacility: {
            text: "Not residing in a minimum-security unit",
          },
        },
        firestoreCollection: "US_ND-TransferToMinFacility",
        hideDenialRevert: false,
        homepagePosition: 2,
        ineligibleCriteriaCopy: {},
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1eHbSEOjjT9FvxffSbXOYEfOYPJheeu6t/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: ["Incarceration", "CaseNotes"],
        snooze: {
          autoSnoozeParams: { params: { days: 3 }, type: "snoozeDays" },
        },
        stateCode: "US_ND",
        subheading:
          "This helps staff identify residents who are eligible for Transfer to a Minimum Security Unit - MRCC or JRMU. Staff are directed to complete a Minimum Housing Referral assessment within Elite for every resident.",
        systemType: "INCARCERATION",
        tabGroups: null,
        tooltipEligibilityText: null,
        urlSection: "TransferToMinFacility",
      },
    },
  };