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
    usMeEarlyTermination: {
      callToAction:
        "Search for officers above to review clients who may be good candidates for early termination from probation.",
      compareBy: null,
      denialReasons: {
        BENEFIT:
          "Continuation on probation would benefit the community or the client",
        COMPLETION: "Has not completed conditions of probation",
        CONDUCT: "Has engaged in prohibited conduct",
        OTHER_CORIS: "Other, please add a case note in CORIS",
      },
      denialText: null,
      displayName: "Early Termination",
      dynamicEligibilityText:
        "client[|s] may be [a|] good candidate[|s] for Early Termination",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {},
      firestoreCollection: "US_ME-earlyTerminationReferrals",
      hideDenialRevert: false,
      homepagePosition: 5,
      ineligibleCriteriaCopy: {},
      initialHeader:
        "Search for officers above to review clients who may be good candidates for early termination from probation.",
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view?usp=sharing",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      stateCode: "US_ME",
      subheading:
        "Early termination is when a probation officer, or the client themselves, files a motion with the court for termination of a period of probation and discharge of the client at a time earlier than that provided in their sentence, if warranted by the conduct of the client. Review clients who may be good candidates for early termination from probation.",
      systemType: "SUPERVISION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "earlyTermination",
    },
    usMeFurloughRelease: {
      callToAction:
        "Search for case managers above to review residents on their caseload who are approaching standard furlough release eligibility and complete application paperwork.",
      compareBy: null,
      denialReasons: {
        "CASE PLAN": "Not compliant with case plan goals",
        PROGRAM:
          "Has not completed, or is not currently participating in, required core programming",
        DECLINE: "Resident declined opportunity to apply for Furlough",
        OTHER_CORIS: "Other, please add a case note in CORIS",
      },
      denialText: null,
      displayName: "Furlough Program",
      dynamicEligibilityText:
        "resident[|s] may be eligible for the Furlough Program",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
          text: "Served at least 30 days at current facility",
          tooltip:
            "Served at least thirty (30) days of the term of imprisonment in the facility providing the furlough program",
        },
        usMeCustodyLevelIsMinimumOrCommunity: {
          text: "Currently on {{lowerCase custodyLevel}}",
          tooltip: "Currently on minimum or community custody",
        },
        usMeThreeYearsRemainingOnSentence: {
          text: "{{monthsRemaining}} months remaining on sentence",
          tooltip:
            "No more than three (3) years remaining on the term(s) of imprisonment or, in the case of a split sentence, on the unsuspended portion, after consideration of any deductions that the resident has received and retained under Title 17-A, Sections 2302(1), 2305, and 2307 to 2311 (i.e., first day on a furlough must be no more than three (3) years prior to the resident’s current custody release date).",
        },
        usMeNoClassAOrBViolationFor90Days: {
          text: "No Class A or B disciplines pending or occurring in the past 90 days",
          tooltip:
            "Must not have been found guilty of a Class A or B disciplinary violation within ninety (90) days of submitting the plan to be transferred to supervised community confinement or anytime thereafter prior to the scheduled transfer and must not have a Class A or B disciplinary report pending at the time of submitting the plan or scheduled transfer.",
        },
        usMeNoDetainersWarrantsOrOther: {
          text: "No detainers, warrants, or other pending holds",
          tooltip:
            "Must have no detainers, warrants, or other pending holds preventing participation in a community program as set out in Department Policy (AF) 23.1",
        },
        usMeServedHalfOfSentence: {
          text: "Served at least 1/2 of sentence",
          tooltip:
            "The resident must have served at least 1/2 of the term of imprisonment imposed or, in the  case of a split sentence, at least 1/2 of the unsuspended portion, after consideration of  any deductions that the resident has received and retained under Title 17-A, Sections 2302(1), 2305, and 2307 to 2311.\n \nA resident who is serving concurrent sentences must have served 1/2 of the term of imprisonment imposed or, in the case of a split sentence, of the unsuspended portion, on the controlling sentence, after consideration of any deductions that the resident has received and retained under Title 17-A, Sections 2302(1), 2305, and 2307 to 2311.\n\nA resident who is serving consecutive or nonconcurrent sentences must have served 1/2 of the imprisonment time to be served on the combined sentences, after consideration of any deductions that the resident has received and retained under Title 17-A, Sections 2302(1), 2305, and 2307 to 2311. Depending on the length of the sentences and the deductions received and retained, a resident may become eligible for a furlough to visit with family during any of the sentences.",
        },
      },
      firestoreCollection: "US_ME-furloughReleaseReferrals",
      hideDenialRevert: false,
      homepagePosition: 6,
      ineligibleCriteriaCopy: {},
      initialHeader: null,
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view?usp=sharing",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["Incarceration", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      stateCode: "US_ME",
      subheading:
        "The furlough program provides residents with the opportunity to prepare for successful reentry into the community by allowing authorized absences from a facility for reasons like arranging for housing, participating in an external education program, maintaining family ties, and more. Review residents approaching furlough release eligibility and complete application paperwork.",
      systemType: "INCARCERATION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "furloughRelease",
    },
    usMeMediumTrustee: {
      callToAction:
        "Search for caseloads to review residents who may be eligible for Medium Trustee Status.",
      compareBy: null,
      denialReasons: {
        BEHAVIOR: "Has not demonstrated prosocial behavior",
        PROGRAM: "Has not completed required core programming",
        DECLINE: "Resident declined Medium Trustee Status",
        OTHER_CORIS: "Other, please add a case note in CORIS",
      },
      denialText: null,
      displayName: "Medium Trustee Status",
      dynamicEligibilityText:
        "resident[|s] may be eligible for Medium Trustee Status",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        usMeCustodyLevelIsMedium: {
          text: "Currently on medium custody",
          tooltip:
            "The resident must be classified as medium custody to be approved for trustee status",
        },
        usMeFiveOrMoreYearsRemainingOnSentence: {
          text: "{{#if opportunity.person.onLifeSentence}} On a life sentence {{else}} {{yearsMonthsUntil opportunity.person.releaseDate}} remaining on sentence {{/if}}",
          tooltip:
            "Residents at medium custody level approved for trustee status are residents who have at least five (5) years remaining on their sentence",
        },
        usMeNoViolationFor5Years: {
          text: "No disciplines in the last 5 years",
          tooltip:
            "Residents at medium custody level approved for trustee status are residents who have been discipline free for at least five (5) years",
        },
      },
      firestoreCollection: "US_ME-mediumTrusteeReferrals",
      hideDenialRevert: false,
      homepagePosition: 3,
      ineligibleCriteriaCopy: {},
      initialHeader:
        "Search for caseloads to review residents who may be eligible for Medium Trustee Status.",
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view?usp=drive_link",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["Incarceration", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      stateCode: "US_ME",
      subheading:
        "This alert helps staff identify residents who may be eligible for Medium Trustee Status and directs staff to contact the Director of Classification to change the resident's status. Medium Custody Trustee status is not a separate custody level and it is not determined by the classification instrument. It is a status that is approved by the Department's Director of Classification, or designee, which allows certain medium custody residents to have extra privileges.",
      systemType: "INCARCERATION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "mediumTrustee",
    },
    usMeReclassificationReview: {
      callToAction:
        "Search for caseloads to review residents who are up for an annual or semi-annual reclassification meeting.",
      compareBy: null,
      denialReasons: {
        COMPLETE: "Reclassification is already completed",
        ERROR: "Reclassification date is incorrect",
        OTHER_CORIS: "Other, please add a case note in CORIS",
      },
      denialText: null,
      displayName: "Annual or Semi-Annual Reclassification",
      dynamicEligibilityText:
        "resident[|s] may be due for an annual or semi-annual reclassification",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        usMeIncarcerationPastRelevantClassificationDate: {
          text: 'At least {{#if (eq record.usMeIncarcerationPastRelevantClassificationDate.reclassType "ANNUAL")}}6{{else}}12{{/if}} months since last reclassification',
          tooltip:
            "Residents:\na. with more than six (6) years remaining to serve based on current custody release date shall be reviewed annually; and\nb. with six (6) years or less remaining to serve based on current custody release date shall be reviewed every six (6) months.",
        },
      },
      firestoreCollection: "US_ME-reclassificationReviewReferrals",
      hideDenialRevert: false,
      homepagePosition: 2,
      ineligibleCriteriaCopy: {
        usMeIncarcerationPastRelevantClassificationDate: {
          text: "Will be due for a reclassification in the next month",
          tooltip:
            "Residents:\na. with more than six (6) years remaining to serve based on current custody release date shall be reviewed annually; and\nb. with six (6) years or less remaining to serve based on current custody release date shall be reviewed every six (6) months.",
        },
      },
      initialHeader:
        "Search for caseloads to review residents who are up for an annual or semi-annual reclassification meeting.",
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view?usp=drive_link",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["Incarceration"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      stateCode: "US_ME",
      subheading:
        "This alert helps staff identify residents who are due or overdue for their Annual or Semi-annual Reclassification and directs staff to schedule an annual or semi-annual reclassification meeting.",
      systemType: "INCARCERATION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "annualReclassification",
    },
    usMeSCCP: {
      callToAction:
        "Search for case managers above to review residents in their unit who are approaching SCCP eligibility and complete application paperwork.",
      compareBy: null,
      denialReasons: {
        "CASE PLAN": "Not compliant with case plan goals",
        PROGRAM: "Has not completed required core programming",
        DISCIPLINE: "Has a Class A or B disciplinary violation pending",
        DECLINE: "Resident declined opportunity to apply for SCCP",
        OTHER_CORIS: "Other, please add a case note in CORIS",
      },
      denialText: null,
      displayName: "Supervised Community Confinement Program",
      dynamicEligibilityText:
        "resident[|s] may be eligible for the Supervised Community Confinement Program",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {},
      firestoreCollection: "US_ME-SCCPReferrals",
      hideDenialRevert: false,
      homepagePosition: 1,
      ineligibleCriteriaCopy: {},
      initialHeader:
        "Search for case managers above to review residents in their unit who are approaching SCCP eligibility and complete application paperwork.",
      isAlert: false,
      methodologyUrl: "https://www.maine.gov/sos/cec/rules/03/201/c10s272.docx",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["Incarceration", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      stateCode: "US_ME",
      subheading:
        "SCCP provides a means of successful reentry of residents into the community. The program allows eligible residents to complete their sentence in the community rather than a facility, while remaining under the legal custody of the Department of Corrections. Review residents who are approaching SCCP eligibility and complete application paperwork.",
      systemType: "INCARCERATION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "SCCP",
    },
    usMeWorkRelease: {
      callToAction:
        "Search for case managers above to review residents on their caseload who are approaching Work Release eligibility and complete application paperwork.",
      compareBy: null,
      denialReasons: {
        "CASE PLAN": "Not compliant with case plan goals",
        PROGRAM:
          "Has not completed, or is not currently participating in, required core programming",
        DECLINE: "Resident declined opportunity to apply for Work Release",
        OTHER_CORIS: "Other, please add a case note in CORIS",
      },
      denialText: null,
      displayName: "Work Release",
      dynamicEligibilityText:
        "client[|s] may be eligible for the Community Transition Program (Work Release)",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {},
      firestoreCollection: "US_ME-workReleaseReferrals",
      hideDenialRevert: false,
      homepagePosition: 4,
      ineligibleCriteriaCopy: {},
      initialHeader: null,
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view?usp=sharing",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["Incarceration", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      stateCode: "US_ME",
      subheading:
        "Work Release provides residents with the opportunity to prepare for successful reentry into the community by allowing approved residents to participate in work, education, or public service outside of the facility. Review residents approaching Work Release eligibility and complete application paperwork.",
      systemType: "INCARCERATION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "workRelease",
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
