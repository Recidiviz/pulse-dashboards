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
    usMeEarlyTermination: {
      callToAction:
        "Search for officers above to review clients who may be good candidates for early termination from probation.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "BENEFIT",
          text: "Continuation on probation would benefit the community or the client",
        },
        {
          key: "COMPLETION",
          text: "Has not completed conditions of probation",
        },
        { key: "CONDUCT", text: "Has engaged in prohibited conduct" },
        { key: "OTHER_CORIS", text: "Other, please add a case note in CORIS" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Early Termination",
      dynamicEligibilityText:
        "client[|s] may be [a|] good candidate[|s] for Early Termination",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      emptyTabCopy: [],
      firestoreCollection: "US_ME-earlyTerminationReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 5,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Search for officers above to review clients who may be good candidates for early termination from probation.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view",
      nonOmsCriteria: [
        {
          text: "Must have fulfilled all proactive conditions of probation",
          tooltip:
            "The Probation Officer shall determine whether the probationer has satisfactorily fulfilled all of the proactive conditions of his or her probation",
        },
        {
          text: "Must have not engaged in conduct prohibited by conditions of probation",
          tooltip:
            "The Probation Officer shall determine whether the probationer has not engaged in conduct prohibited by his or her conditions of probation and in the opinion of the supervising Probation Officer continuation on probation would not benefit the community (including the victim, if any) or the probationer",
        },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ME",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Early Termination provides that a Probation Officer, or a client themselves, may file a motion with the court for termination of a period of probation and discharge of the client at a time earlier than that provided in their sentence, if warranted by the conduct of the client.<br /><br />Every Probation Officer shall review all probation cases, at least annually, to determine which are appropriate for early termination of probation or conversion to administrative release.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "earlyTermination",
      zeroGrantsTooltip: null,
      caseNotesTitle: null,
    },
    usMeFurloughRelease: {
      callToAction:
        "Search for case managers above to review residents on their caseload who are approaching standard furlough release eligibility and complete application paperwork.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "CASE PLAN", text: "Not compliant with case plan goals" },
        {
          key: "PROGRAM",
          text: "Has not completed, or is not currently participating in, required core programming",
        },
        {
          key: "DECLINE",
          text: "Resident declined opportunity to apply for Furlough",
        },
        { key: "OTHER_CORIS", text: "Other, please add a case note in CORIS" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Furlough Program",
      dynamicEligibilityText:
        "resident[|s] may be eligible for the Furlough Program",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usMeCustodyLevelIsMinimumOrCommunity",
          text: "Currently on eligible custody level: {{lowerCase custodyLevel}}",
          tooltip: "Currently on minimum or community custody",
        },
        {
          key: "usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease",
          text: "Served at least 30 days at current facility",
          tooltip:
            "Served at least thirty (30) days of the term of imprisonment in the facility providing the furlough program",
        },
        {
          key: "usMeThreeYearsRemainingOnSentence",
          text: "Has three (3) years or fewer remaining on term",
          tooltip:
            "No more than three (3) years remaining on the term(s) of imprisonment or, in the case of a split sentence, on the unsuspended portion, after consideration of any deductions that the resident has received and retained under Title 17-A, Sections 2302(1), 2305, and 2307 to 2311 (i.e., first day on a furlough must be no more than three (3) years prior to the resident’s current custody release date).",
        },
        {
          key: "usMeNoDetainersWarrantsOrOther",
          text: "No detainers, warrants, or other pending holds",
          tooltip:
            "Must have no detainers, warrants, or other pending holds preventing participation in a community program as set out in Department Policy (AF) 23.1",
        },
        {
          key: "usMeNoClassAOrBViolationFor90Days",
          text: "No Class A or B disciplines pending or occurring in the past 90 days",
          tooltip:
            "Must not have been found guilty of a Class A or B disciplinary violation within ninety (90) days of submitting the plan to be transferred to supervised community confinement or anytime thereafter prior to the scheduled transfer and must not have a Class A or B disciplinary report pending at the time of submitting the plan or scheduled transfer.",
        },
        {
          key: "usMeServedHalfOfSentence",
          text: "Has served minimum required time on term: Served at least 1/2 of sentence",
          tooltip:
            "The resident must have served at least 1/2 of the term of imprisonment imposed or, in the case of a split sentence, at least 1/2 of the unsuspended portion, after consideration of any deductions that the resident has received and retained under Title 17-A, Sections 2302(1), 2305, and 2307 to 2311.  A resident who is serving concurrent sentences must have served 1/2 of the term of imprisonment imposed or, in the case of a split sentence, of the unsuspended portion, on the controlling sentence, after consideration of any deductions that the resident has received and retained under Title 17-A, Sections 2302(1), 2305, and 2307 to 2311.  A resident who is serving consecutive or nonconcurrent sentences must have served 1/2 of the imprisonment time to be served on the combined sentences, after consideration of any deductions that the resident has received and retained under Title 17-A, Sections 2302(1), 2305, and 2307 to 2311. Depending on the length of the sentences and the deductions received and retained, a resident may become eligible for a furlough to visit with family during any of the sentences.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ME-furloughReleaseReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 6,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view",
      nonOmsCriteria: [
        { text: "Must have completed assigned core programs" },
        { text: "Must be currently case plan compliant" },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ME",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "The Furlough program provides residents with the opportunity to prepare for successful reentry into the community by allowing authorized absences from a facility for reasons like arranging for housing, participating in an external education program, maintaining family ties, and more.<br /><br />Review residents approaching furlough release eligibility and complete application paperwork.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "furloughRelease",
      zeroGrantsTooltip: null,
      caseNotesTitle: null,
    },
    usMeMediumTrustee: {
      callToAction:
        "Search for caseloads to review residents who may be eligible for Medium Trustee Status.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "BEHAVIOR", text: "Has not demonstrated prosocial behavior" },
        { key: "PROGRAM", text: "Has not completed required core programming" },
        { key: "DECLINE", text: "Resident declined medium trustee status" },
        { key: "OTHER_CORIS", text: "Other: Please add a case note in CORIS" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Medium Trustee Status",
      dynamicEligibilityText:
        "resident[|s] may be eligible for Medium Trustee Status",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usMeCustodyLevelIsMedium",
          text: "Currently on medium custody",
          tooltip:
            "The resident must be classified as medium custody to be approved for trustee status",
        },
        {
          key: "usMeFiveOrMoreYearsRemainingOnSentence",
          text: "Has five (5) years or more remaining on term: {{#if opportunity.person.onLifeSentence}} On a life sentence {{else}} {{yearsMonthsUntil opportunity.person.releaseDate}} remaining{{/if}}",
          tooltip:
            "Residents at medium custody level approved for trustee status are residents who have at least five (5) years remaining on their sentence",
        },
        {
          key: "usMeNoViolationFor5Years",
          text: "No disciplines in the last 5 years",
          tooltip:
            "Residents at medium custody level approved for trustee status are residents who have been discipline free for at least five (5) years",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ME-mediumTrusteeReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 3,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Search for caseloads to review residents who may be eligible for Medium Trustee Status.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view",
      nonOmsCriteria: [
        { text: "Must have completed required core programming" },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ME",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents who may be eligible for Medium Trustee Status and directs staff to contact the Director of Classification to change the resident’s status.<br /><br />Medium Custody Trustee status is not a separate custody level and is not determined by the classification instrument. It is a status that is approved by the Department’s Director of Classification, or designee, which allows certain medium custody residents to have extra privileges.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "mediumTrustee",
      zeroGrantsTooltip: null,
      caseNotesTitle: null,
    },
    usMeReclassificationReview: {
      callToAction:
        "Search for caseloads to review residents who are up for an annual or semi-annual reclassification meeting.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "INCORRECT_DATE", text: "Reclassification date is incorrect" },
        { key: "OTHER_CORIS", text: "Other: Please add a case note in CORIS" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Annual or Semi-Annual Reclassification",
      dynamicEligibilityText:
        "resident[|s] may be due for an annual or semi-annual reclassification",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usMeIncarcerationPastRelevantClassificationDate",
          text: 'At least {{#if (eq reclassType "ANNUAL")}}12{{else}}6{{/if}} months since last reclassification{{#if latestClassificationDate}}: {{latestClassificationDate}}{{/if}}',
          tooltip:
            "Residents:\na. with more than six (6) years remaining to serve based on current custody release date shall be reviewed annually; and\nb. with six (6) years or less remaining to serve based on current custody release date shall be reviewed every six (6) months.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ME-reclassificationReviewReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [
        {
          key: "usMeIncarcerationPastRelevantClassificationDate",
          text: "Will be due for a reclassification in under a month",
          tooltip:
            "Residents:\na. with more than six (6) years remaining to serve based on current custody release date shall be reviewed annually; and\nb. with six (6) years or less remaining to serve based on current custody release date shall be reviewed every six (6) months.",
        },
      ],
      initialHeader:
        "Search for caseloads to review residents who are up for an annual or semi-annual reclassification meeting.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ME",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents who are due or overdue for their Annual or Semi-Annual Reclassification and directs staff to schedule an Annual or Semi-Annual reclassification meeting.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "annualReclassification",
      zeroGrantsTooltip: null,
      caseNotesTitle: null,
    },
    usMeSCCP: {
      callToAction:
        "Search for case managers above to review residents in their unit who are approaching SCCP eligibility and complete application paperwork.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "CASE PLAN", text: "Not compliant with case plan goals" },
        { key: "PROGRAM", text: "Has not completed required core programming" },
        {
          key: "DISCIPLINE",
          text: "Has a Class A or B disciplinary violation pending",
        },
        {
          key: "HOUSING",
          text: "Resident does not have a stable home to be released to",
        },
        {
          key: "DECLINE",
          text: "Resident declined opportunity to apply for SCCP",
        },
        { key: "OTHER_CORIS", text: "Other: Please add a case note in CORIS" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Supervised Community Confinement Program",
      dynamicEligibilityText:
        "resident[|s] may be eligible for the Supervised Community Confinement Program",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      emptyTabCopy: [],
      firestoreCollection: "US_ME-SCCPReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Search for case managers above to review residents in their unit who are approaching SCCP eligibility and complete application paperwork.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "https://www.maine.gov/sos/cec/rules/03/201/c10s272.docx",
      nonOmsCriteria: [
        { text: "Must have completed assigned core programs" },
        { text: "Must be currently case plan compliant" },
        {
          text: "Resident has a stable home to be released to",
          tooltip:
            "Suitable housing in the community may consist of: \na. a home; \nb. a full-time treatment facility, such as a residential substance use disorder treatment facility or mental health facility; \nc. transitional housing that provides support services for targeted groups, e.g., veterans, domestic violence victims, persons with mental illness, persons with substance use disorder problems, etc.; \nd. temporary housing associated with education or vocational training or employment; \ne. a hospital or other appropriate care facility, such as a nursing facility, residential care facility or a facility that is a licensed hospice program pursuant to Title 22, Section 8622; or \nf. any other approved housing in the community.",
        },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ME",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "SCCP provides a means of successful reentry of residents into the community. The program allows eligible residents to complete their sentence in the community rather than a facility, while remaining under the legal custody of the Department of Corrections.<br /><br />Review residents who are eligible or approaching eligibility for SCCP and complete application paperwork.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "SCCP",
      zeroGrantsTooltip: null,
      caseNotesTitle: null,
    },
    usMeWorkRelease: {
      callToAction:
        "Search caseloads to review residents for Work Release eligibility & complete application paperwork.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "CASE PLAN", text: "Not compliant with case plan goals" },
        {
          key: "PROGRAM",
          text: "Has not completed, or is not currently participating in, required core programming",
        },
        {
          key: "DECLINE",
          text: "Resident declined opportunity to apply for Work Release",
        },
        { key: "OTHER_CORIS", text: "Other: Please add a case note in CORIS" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Work Release",
      dynamicEligibilityText:
        "client[|s] may be eligible for the Community Transition Program (Work Release)",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      emptyTabCopy: [],
      firestoreCollection: "US_ME-workReleaseReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 4,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1RIzASrkIaynsnUns8HGwyVxL8arqXlYH/view",
      nonOmsCriteria: [
        { text: "Must have completed assigned core programs" },
        { text: "Must be currently case plan compliant" },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ME",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Work Release provides residents with the opportunity to prepare for successful reentry into the community by allowing approved residents to participate in work, education, or public service outside of the facility.<br /><br />Review residents approaching Work Release eligibility and complete application paperwork.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "workRelease",
      zeroGrantsTooltip: null,
      caseNotesTitle: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
