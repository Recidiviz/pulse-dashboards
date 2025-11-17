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
    usMoOutsideClearance: {
      callToAction: "Generate form",
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "WARDEN", text: "Was denied warden approval" },
        {
          key: "CURRENT PARTICIPANT",
          text: "Already assigned to Outside Clearance",
        },
        {
          key: "MENTAL HEALTH",
          text: "Doesn't meet mental health requirements",
        },
        { key: "RELEASE", text: "Does not meet release date criteria" },
        {
          key: "DETAINER",
          text: "Has outstanding wants, warrants, or detainers",
        },
        {
          key: "ESCAPE",
          text: "Has perimeter escape or absconsion history on current offense or within the last 10 years",
        },
        { key: "SANCTIONS", text: "Has disqualifying C-3 sanction(s)" },
        {
          key: "MEDICAL",
          text: "Has a medical condition preventing participation",
        },
        {
          key: "SOP",
          text: "Does not meet other, institution-specific criteria in standard operating procedures",
        },
        {
          key: "NOT INTERESTED",
          text: "Resident is not interested in participating",
        },
        { key: "OTHER", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Outside Clearance",
      dynamicEligibilityText:
        "resident[|s] may be eligible for outside clearance",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usMoMentalHealthScore3OrBelowWhileIncarcerated",
          text: "Mental health needs score is MH-1 or MH-2 (or MH-3, with written recommendation)",
          tooltip:
            "If MH-3, mental health staff members must evaluate the resident and make a written recommendation regarding outside-clearance participation.",
        },
        {
          key: "usMoInstitutionalRiskScore1WhileIncarcerated",
          text: "Institutional risk score is I-1",
        },
        {
          key: "usMoWithin60MonthsOfEarliestReleaseDate",
          text: "Within 60 months of earliest established release date",
        },
        {
          key: "usMoNoEscapeIn10YearsOrCurrentCycle",
          text: "No perimeter escapes within the current sentence structure or within the past 10 years",
          tooltip:
            "Residents must have no history of security perimeter escapes within current sentence structure or within the last 10 years. Escapes while not on supervision and absconsions are considered on a case-by-case basis.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_MO-outsideClearanceReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 6,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Review residents who may be eligible for Outside Clearance and download a pre-filled application.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "TBD",
      nonOmsCriteria: [
        {
          text: "No outstanding wants, warrants, or detainers for Class A–D felonies",
          tooltip:
            "Misdemeanor warrants from out of state should be reviewed to ensure they are not considered felony wants in Missouri. Residents participating in Outside Clearance should be checked for felony wants, warrants, or detainers at least monthly.",
        },
        {
          text: "No violations for introducing drugs or contraband within the past 2 years",
          tooltip:
            "Residents who have a history of introducing illicit drugs or contraband into a correctional facility (including suspicion of involvement, conspiracy, and investigation) cannot be considered for at least 2 years from the last violation.",
        },
        { text: "Does not have any disqualifying C-3 sanctions" },
        {
          text: "Meets any other institution-specific requirements established in standard operating procedures (SOP)",
        },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [],
      omsCriteriaHeader: "Validated by data from MOCIS and OP-II",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MO",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Outside Clearance is a program allowing residents to work on assignments located outside the security perimeter that are on department property and supervised by department staff members.",
      submittedTabTitle: "Submitted",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "outsideClearance",
      zeroGrantsTooltip: null,
    },
    usMoOverdueRestrictiveHousingInitialHearing: {
      callToAction:
        "Review residents and prepare necessary paperwork for their hearing.",
      caseNotesTitle: null,
      compareBy: [
        { field: "eligibilityDate", undefinedBehavior: "undefinedFirst" },
      ],
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "BEDS",
          text: "Released early due to a need for Restrictive Housing beds",
        },
        { key: "SPACE", text: "Completed time but pending bed space" },
        { key: "RELEASED", text: "Released this week" },
        { key: "OUTDATED", text: "Hearing occurred this week" },
        {
          key: "EXTENDED",
          text: "Received a new minor rule violation, resulting in an extension to their Restrictive Housing placement",
        },
        {
          key: "REFERRED",
          text: "Received a new major rule violation, resulting in a referral to Extended Restrictive Housing Review Committee",
        },
        { key: "Other", text: "Other" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Temporary Assignment",
      dynamicEligibilityText:
        "resident[|s] on Temporary Assignment to review for their initial meaningful hearing",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      emptyTabCopy: [],
      firestoreCollection:
        "US_MO-overdueRestrictiveHousingInitialHearingReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 3,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1IyslsgIVlpACCtEeTmJKFttEp0Fmuc9A/view?usp=sharing",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["UsMoIncarceration", "UsMoRestrictiveHousing"],
      snooze: {
        autoSnoozeParams: {
          params: { weekday: "Sunday" },
          type: "snoozeUntil",
        },
      },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MO",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents in Temporary Assignment who are overdue or due for an initial meaningful hearing.",
      submittedTabTitle: null,
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Overdue as of Sep 9, 2024",
            "Due this week",
            "Coming up",
            "Overridden",
            "Missing Review Date",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "overdueRestrictiveHousingInitialHearing",
      zeroGrantsTooltip: null,
    },
    usMoOverdueRestrictiveHousingRelease: {
      callToAction:
        "Review residents for release and prepare necessary paperwork for their return to general population.",
      caseNotesTitle: null,
      compareBy: [
        { field: "eligibilityDate", undefinedBehavior: "undefinedFirst" },
      ],
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "BEDS",
          text: "Released early due to a need for Restrictive Housing beds",
        },
        { key: "SPACE", text: "Completed time but pending bed space" },
        { key: "RELEASED", text: "Released this week" },
        {
          key: "EXTENDED",
          text: "Received a new minor rule violation, resulting in an extension to their Restrictive Housing placement",
        },
        {
          key: "REFERRED",
          text: "Received a new major rule violation, resulting in a referral to Extended Restrictive Housing Review Committee",
        },
        { key: "Other", text: "Other" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Release from Restrictive Housing",
      dynamicEligibilityText:
        "resident[|s] to review for release from Restrictive Housing",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      emptyTabCopy: [],
      firestoreCollection: "US_MO-overdueRestrictiveHousingReleaseReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1IyslsgIVlpACCtEeTmJKFttEp0Fmuc9A/view?usp=sharing",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["UsMoIncarceration", "UsMoRestrictiveHousing"],
      snooze: {
        autoSnoozeParams: {
          params: { weekday: "Sunday" },
          type: "snoozeUntil",
        },
      },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MO",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents in Restrictive Housing who have already reached or are about to reach the total number of days they were assigned to serve in restrictive housing before returning to the General Population. Review residents for release and prepare necessary paperwork for their return to the General Population.",
      submittedTabTitle: null,
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Overdue as of Sep 9, 2024",
            "Due this week",
            "Coming up",
            "Overridden",
            "Missing Review Date",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "overdueRestrictiveHousingRelease",
      zeroGrantsTooltip: null,
    },
    usMoOverdueRestrictiveHousingReviewHearing: {
      callToAction:
        "Review residents and prepare necessary paperwork for their next hearing",
      caseNotesTitle: null,
      compareBy: [
        { field: "eligibilityDate", undefinedBehavior: "undefinedFirst" },
      ],
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "BEDS",
          text: "Released early due to a need for Extended Restrictive Housing beds",
        },
        { key: "SPACE", text: "Completed time but pending bed space" },
        { key: "RELEASED", text: "Released this week" },
        { key: "OUTDATED", text: "Hearing occurred this week" },
        { key: "Other", text: "Other" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Extended Restrictive Housing Review",
      dynamicEligibilityText:
        "resident[|s] in Extended Restrictive Housing to review for their next hearing",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      emptyTabCopy: [],
      firestoreCollection:
        "US_MO-overdueRestrictiveHousingReviewHearingReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 4,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1IyslsgIVlpACCtEeTmJKFttEp0Fmuc9A/view?usp=sharing",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["UsMoIncarceration", "UsMoRestrictiveHousing"],
      snooze: {
        autoSnoozeParams: {
          params: { weekday: "Sunday" },
          type: "snoozeUntil",
        },
      },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MO",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents in Extended Restrictive Housing  who are overdue or due for a hearing. Review residents and prepare necessary paperwork for their next hearing.",
      submittedTabTitle: null,
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Overdue as of Sep 9, 2024",
            "Due this week",
            "Coming up",
            "Overridden",
            "Missing Review Date",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "overdueRestrictiveHousingReviewHearing",
      zeroGrantsTooltip: null,
    },
    usMoWorkRelease: {
      callToAction: "Generate form",
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "WARDEN", text: " Was denied warden approval" },
        {
          key: "CURRENT PARTICIPANT",
          text: "Already assigned to Work Release",
        },
        {
          key: "MENTAL HEALTH",
          text: "Doesn't meet mental health requirements",
        },
        { key: "RELEASE", text: "Does not meet release date criteria" },
        { key: "DETAINER", text: "Outstanding wants, warrants, or detainers" },
        { key: "OFFENSE", text: "Current or prior offense type is excluded" },
        { key: "ABUSE", text: "Has a history of child abuse or sex offenses" },
        {
          key: "ESCAPE",
          text: "Has perimeter escape or absconsion history on current offense or within the last 10 years",
        },
        {
          key: "COMMUNITY IMPACT",
          text: "Potential adverse community impact due to known gang affiliation or involvement with organized crime",
        },
        {
          key: "EDUCATION",
          text: "Does not meet minimum educational requirements",
        },
        {
          key: "OC",
          text: "Has not yet completed required 12 months of Outside Clearance required based on offense",
        },
        { key: "EMPLOYER", text: "Receiving employer denied the placement" },
        { key: "SANCTIONS", text: "Has disqualifying C-3 sanction(s)" },
        {
          key: "MEDICAL",
          text: "Has a medical condition preventing participation",
        },
        {
          key: "SOP",
          text: "Does not meet other, institution-specific criteria in standard operating procedures",
        },
        {
          key: "NOT INTERESTED",
          text: "Resident is not interested in participating",
        },
        { key: "OTHER", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Work Release",
      dynamicEligibilityText: "resident[|s] may be eligible for work release",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usMoMentalHealthScore3OrBelowWhileIncarcerated",
          text: "Mental health needs score is MH-1 or MH-2 (or MH-3, with written recommendation)",
          tooltip:
            "If MH-3, mental health staff members must evaluate the resident and make a written recommendation regarding work-release participation.",
        },
        {
          key: "usMoInstitutionalRiskScore1WhileIncarcerated",
          text: "Institutional risk score is I-1",
        },
        {
          key: "usMoMeetsTimeRemainingRequirementsWorkRelease",
          text: "Within 48 months of earliest established release date",
          tooltip: "",
        },
        {
          key: "usMoNoEscapeIn10YearsOrCurrentCycle",
          text: "No perimeter escapes within the current sentence structure or within the past 10 years",
          tooltip:
            "Residents must have no history of security perimeter escapes within current sentence structure or within the last 10 years. Escapes while not on supervision and absconsions are considered on a case-by-case basis.",
        },
        {
          key: "usMoEducationalScore1",
          text: "Meets educational requirements",
          tooltip:
            "Residents must meet criteria outlined in departmental procedures regarding mandatory academic education. Recidiviz checks for an E-1 education needs score to determine whether a resident meets this eligibility requirement.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_MO-workReleaseReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 5,
      ineligibleCriteriaCopy: [],
      initialHeader:
        "Review residents who may be eligible for Work Release and download a pre-filled application.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl: "TBD",
      nonOmsCriteria: [
        {
          text: "Arson I or Robbery I: Within 24 months of release and has completed 12+ months of outside clearance",
          tooltip:
            "If current or prior conviction for Arson I or Robbery I, resident must be within 24 months of earliest release date and must have completed at least 12 months on supervised outside clearance assignment.",
        },
        {
          text: "No outstanding wants, warrants, or detainers for Class A–E felonies",
          tooltip:
            "Misdemeanor warrants from out of state should be reviewed to ensure they are not considered felony wants in Missouri. Residents participating in Supervised Work Release should be checked for felony wants, warrants, or detainers at least monthly.",
        },
        {
          text: "No current or prior conviction for an excluded offense",
          tooltip:
            "Excluded offenses are rape and attempted rape, sodomy and attempted sodomy, kidnapping, assault in the first degree, and murder in the first or second degree.",
        },
        {
          text: "No conviction or demonstrated pattern of child abuse or sexual offenses",
          tooltip: "",
        },
        {
          text: "No violations for introducing drugs or contraband within the past 2 years",
          tooltip:
            "Residents who have a history of introducing illicit drugs or contraband into a correctional facility (including suspicion of involvement, conspiracy, and investigation) cannot be considered for at least 2 years from the last violation.",
        },
        {
          text: "Consider adverse community impact due to factors such as gang or organized crime involvement",
          tooltip:
            "Consideration shall be given to whether the offender’s presence in the community may cause adverse community reaction due to factors such as organized crime affiliation or gang involvement.",
        },
        { text: "Does not have any disqualifying C-3 sanctions" },
        {
          text: "Meets any other institution-specific requirements established in standard operating procedures (SOP)",
        },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [],
      omsCriteriaHeader: "Validated by data from MOCIS and OP-II",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MO",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Supervised Work Release is a program that allows residents to work outside of the institution under the supervision of department staff members or trained employees of another private, nonprofit, or government agency.",
      submittedTabTitle: "Submitted",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "workRelease",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
