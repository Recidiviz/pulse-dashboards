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
    usMiAddInPersonSecurityClassificationCommitteeReview: {
      callToAction:
        "Complete SCC review and fill out 283 Form for eligible residents, inclusive of ADD signature.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "PRIOR RH",
          text: "Prior restrictive housing history requires management at more restrictive level",
        },
        {
          key: "PLACING BEHAVIOR",
          text: "Severe placing behavior necessitates longer stay in segregation",
        },
        { key: "RESPECT", text: "Fails to be cordial and respectful to staff" },
        {
          key: "ATTITUDE",
          text: "Behavior and attitude not consistent with general population expectations",
        },
        { key: "MISCONDUCTS", text: "Misconduct(s) filed during segregation" },
        {
          key: "GP NOT APPROPRIATE",
          text: "Unable to honor trust implicit in less restrictive environment ",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "ADD In-Person Review",
      dynamicEligibilityText:
        "resident[|s] [is|are] eligible for in-person review by the ADD at SCC to potentially return to general population",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usMiPastAddInPersonReviewForSccDate",
          text: "{{record.metadata.daysInCollapsedSolitarySession}} consecutive days in restrictive housing;{{#if latestADDInPersonSccReviewDate}} last ADD in-person review recorded on {{date latestADDInPersonSccReviewDate}};{{/if}} ADD in-person review due on or before {{date nextSccDate}}",
          tooltip:
            "ADDs shall personally interview each prisoner in their respective regions who has been confined in administrative segregation for twelve continuous months. If the prisoner continues in administrative segregation beyond the first twelve month period, the ADD shall interview the prisoner every twelve months thereafter until the prisoner is released from administrative segregation.",
        },
        {
          key: "usMiInSolitaryConfinementAtLeastOneYear",
          text: "Currently in {{usMiSegregationDisplayName record.formInformation.segregationType}}",
          tooltip:
            '{{#if (eq record.formInformation.segregationType "ADMINISTRATIVE_SOLITARY_CONFINEMENT")}}Housing unit team members and SCC shall regularly review the behavioral adjustment of each prisoner classified to administrative segregation, including prisoners classified to administrative segregation who are serving a detention sanction for misconduct.{{else if (eq record.formInformation.segregationType "TEMPORARY_SOLITARY_CONFINEMENT")}}If the prisoner is held in temporary segregation for more than 30 calendar days, the facility shall afford the prisoner a review to determine whether there is a continuing need for separation.{{/if}}',
        },
      ],
      emptyTabCopy: [],
      firestoreCollection:
        "US_MI-addInPersonSecurityClassificationCommitteeReview",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 8,
      ineligibleCriteriaCopy: [
        {
          key: "usMiPastAddInPersonReviewForSccDate",
          text: "Next ADD in-person review due in the next two months, on or before {{date nextSccDate}}",
          tooltip:
            "ADDs shall personally interview each prisoner in their respective regions who has been confined in administrative segregation for twelve continuous months. If the prisoner continues in administrative segregation beyond the first twelve month period, the ADD shall interview the prisoner every twelve months thereafter until the prisoner is released from administrative segregation.",
        },
        {
          key: "usMiInSolitaryConfinementAtLeastOneYear",
          text: "In restrictive housing for {{daysToYearsMonthsPast record.metadata.daysInCollapsedSolitarySession}}",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "UsMiRestrictiveHousing",
        "CaseNotes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 30 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MI",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents in restrictive housing who have spent 1+ consecutive year(s) in segregation and are therefore due for an in-person SCC review with the relevant ADD. Complete an SCC review and fill out the pre-filled 283 Form for eligible residents, inclusive of ADD signature. Where possible, work to transfer residents who no longer need to be in temporary or administrative segregation back to general population. See frequently asked questions [here](https://drive.google.com/file/d/1aqHekX0rxCYc1U1KZdo-nK3ZS62pjKuR/view?usp=sharing).",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Overdue",
            "Due now",
            "Upcoming",
            "Marked Ineligible",
            "Pending",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "addInPersonSecurityClassificationCommitteeReview",
      zeroGrantsTooltip: null,
    },
    usMiClassificationReview: {
      callToAction:
        "Review clients who meet the time threshold for classification review and downgrade supervision levels in COMS.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "VIOLATIONS",
          text: "Excessive violation behavior during current review period",
        },
        {
          key: "EMPLOYMENT",
          text: "Chronic unemployment with no effort to job search or recent, concerning unemployment",
        },
        {
          key: "FINES & FEES",
          text: "No effort to pay fines and fees despite documented ability to pay",
        },
        {
          key: "CASE PLAN",
          text: "No progress toward completion of Transition Accountability Plan goals/tasks",
        },
        {
          key: "NONCOMPLIANT",
          text: "Noncompliant with the order of supervision",
        },
        { key: "ABSCONSION", text: "Chronic missing of reporting dates" },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Classification Review",
      dynamicEligibilityText:
        "client[|s] may be eligible for a supervision level downgrade",
      eligibilityDateText: "Next Classification Due Date",
      eligibleCriteriaCopy: [
        {
          key: "usMiClassificationReviewPastDueDate",
          text: "Recommended classification review date, based on supervision start date and last classification review date, is {{date eligibleDate}}",
          tooltip:
            "Classification reviews shall be completed after six months of active supervision […] Subsequent classification reviews shall be scheduled at six-month intervals.",
        },
        {
          key: "usMiNotAlreadyOnLowestEligibleSupervisionLevel",
          text: "Currently eligible based on offense type and supervision level",
          tooltip:
            "The supervising Agent shall ensure that a Correctional Offender Management Profiling for Alternative Sanctions (COMPAS) has been completed for each offender on their active caseload as outlined in OP 06.01.145 “Administration and Use of COMPAS and TAP.” Unless mandated by statute or other criteria as directed in this operating procedure, the COMPAS shall be used to determine the initial supervision level of each offender.\nUnless an offender’s supervision level is mandated by policy or statute, the supervising Agent shall reduce an offender’s supervision level if the offender has satisfactorily completed six continuous months at the current assigned supervision level.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_MI-classificationReviewReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "UsMiRecommendedSupervisionLevel",
        "EligibilityDate",
        "ClientProfileDetails",
        "CaseNotes",
      ],
      snooze: {
        autoSnoozeParams: { params: { days: 180 }, type: "snoozeDays" },
      },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MI",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify clients due or overdue for a classification review, which are generally mandated after six months of supervision and at six-month intervals thereafter, though some clients must receive a classification review earlier than six months by policy. Agents may reconsider the supervision level for a client based on developments in their case and behavior; per FOA Field Memorandum 2023-211, agents are presumptively required to downgrade clients’ supervision level during each classification review, provided that they have “satisfactorily completed” the prior six months on supervision. Review clients who meet the time threshold for classification review as per OP 06.04.130I and downgrade their supervision level in COMS.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "classificationReview",
      zeroGrantsTooltip: null,
    },
    usMiEarlyDischarge: {
      callToAction:
        "Review clients who may be eligible for early discharge and complete discharge paperwork in COMS.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "CHILD ABUSE ORDER",
          text: "CHILD ABUSE ORDER: Child abuse prevention order filed during supervision period",
        },
        {
          key: "SUSPECTED OFFENSE",
          text: "SUSPECTED OFFENSE: Suspected of a felony, assaultive misdemeanor, OWI, or offense requiring SORA registration",
        },
        {
          key: "FELONY/STATE PROBATION",
          text: "FELONY/STATE PROBATION: On parole and also on other state or federal probation supervision for an offense committed during the current period",
        },
        {
          key: "NEEDS",
          text: "NEEDS: On parole and all criminogenic needs have not been addressed",
        },
        {
          key: "NONCOMPLIANT",
          text: "NONCOMPLIANT: Not compliant with the order of supervision",
        },
        {
          key: "PROGRAMMING",
          text: "PROGRAMMING: Has not completed all required programming",
        },
        {
          key: "PRO-SOCIAL",
          text: "PRO-SOCIAL: Has not demonstrated pro-social behavior",
        },
        {
          key: "RESTITUTION",
          text: "RESTITUTION: Has not completed court-ordered restitution payments",
        },
        {
          key: "FINES & FEES",
          text: "FINES & FEES: Willful nonpayment of restitution, fees, court costs, fines, and other monetary obligations despite clear ability to pay",
        },
        {
          key: "PENDING CHARGES",
          text: "PENDING CHARGES: Pending felony charges/warrant",
        },
        {
          key: "ORDERED TREATMENT",
          text: "ORDERED TREATMENT: Has not completed all required treatment",
        },
        {
          key: "EXCLUDED OFFENSE",
          text: "EXCLUDED OFFENSE: On parole for an offense resulting in death or serious bodily injury or an offense involving the discharge of a firearm",
        },
        {
          key: "EXCLUDED CURRENT OFFENSE",
          text: "EXCLUDED CURRENT OFFENSE: On probation for MCL 750.81 or MCL 750.84, for an offense requiring a mandatory probation term (750.411H, 750.411I, 750.136b), or for a sex offense",
        },
        {
          key: "EXCLUDED NEW OFFENSE",
          text: "EXCLUDED NEW OFFENSE: A new offense while on probation that is a felony, assaultive misdemeanor, or requires SORA registration",
        },
        {
          key: "JUDGE",
          text: "JUDGE: County Judge declined client for consideration",
        },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Early Discharge",
      dynamicEligibilityText: "client[|s] may be eligible for early discharge",
      eligibilityDateText: "Earliest Eligibility Date for Early Discharge",
      eligibleCriteriaCopy: [
        {
          key: "supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate",
          text: 'Completed at least half of {{#if (eq record.metadata.supervisionType "Parole")}}parole{{else}}probation{{/if}} term',
          tooltip:
            '{{#if (eq record.metadata.supervisionType "Parole")}}A parolee is eligible for early discharge consideration prior to the expiration of the original term of parole if they have completed at least one-half of an original parole term of 12 months or more{{else}}An offender may be considered for discharge prior to the expiration of the original term of probation if they have completed at least one-half of the probation term{{/if}}',
        },
        {
          key: "servingAtLeastOneYearOnParoleSupervisionOrSupervisionOutOfState",
          text: "Serving a parole term of 12 months or more",
          tooltip:
            "A parolee is eligible for early discharge consideration prior to the expiration of the original term of parole if they have completed at least one-half of an original parole term of 12 months or more",
        },
        {
          key: "usMiParoleDualSupervisionPastEarlyDischargeDate",
          text: "Served mandatory period of parole",
          tooltip:
            "The parolee has served any mandatory period of parole as set forth in Paragraph F. ",
        },
        {
          key: "usMiNoActivePpo",
          text: 'No active PPO ordered during the {{#if (eq record.metadata.supervisionType "Parole")}}parole{{else}}probation{{/if}} term',
          tooltip:
            'The {{#if (eq record.metadata.supervisionType "Parole")}}parolee{{else}}offender{{/if}} does not have an active PPO […] that was ordered against him/her during the {{#if (eq record.metadata.supervisionType "Parole")}}parole{{else}}probation{{/if}} term.',
        },
        {
          key: "usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision",
          text: 'Not involved in a felony, assaultive misdemeanor, or offense requiring SORA registration while on {{#if (eq record.metadata.supervisionType "Parole")}}parole{{else}}probation{{/if}}',
          tooltip:
            '{{#if (eq record.metadata.supervisionType "Parole")}}The parolee is not known to have been involved in […] felonious behavior, assaultive misdemeanor behavior (as set forth in Attachment A) […] or an offense that requires registration under the Sex Offender Registration Act while on parole.{{else}}The offender is not known to have been involved in […] felonious behavior or assaultive misdemeanor behavior as set forth in Attachment A “OP 06.01.145B Assaultive Misdemeanor List” which occurred while on probation or any offense that requires registration under the Sex Offender Registration Act (SORA), which occurred while on probation.{{/if}}',
        },
        {
          key: "usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision",
          text: "Not serving for an offense excluded from early discharge eligibility by policy",
          tooltip:
            "The parolee is not serving for an offense […] required to be registered under the Sex Offender Registration Act.",
        },
        {
          key: "usMiNotServingIneligibleOffensesForEarlyDischargeFromProbationSupervision",
          text: "Not serving for an offense excluded from early discharge eligibility by policy",
          tooltip:
            "The offender is not currently serving for an offense that requires a mandatory term of probation as identified in Paragraph H. The offender is not currently serving for MCL 750.81 or MCL 750.84 (Assault with Intent to commit Great Bodily Harm Less than Murder).",
        },
        {
          key: "usMiSupervisionOrSupervisionOutOfStateLevelIsNotSai",
          text: "Not paroled from SAI on current term",
          tooltip:
            "The parolee was not paroled from the Special Alternative Incarceration (SAI) program on the current term (see definition).",
        },
        {
          key: "supervisionOrSupervisionOutOfStateLevelIsNotHigh",
          text: "Not on intensive supervision",
        },
        {
          key: "usMiNoOwiViolationOnParoleDualSupervision",
          text: "Not involved in an OWI offense while on parole",
          tooltip:
            "The parolee is not known to have been involved in […] a violation of MCL 257.625 (OWI) […] while on parole.",
        },
        { key: "usMiNoPendingDetainer", text: "No pending detainers" },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_MI-earlyDischargeReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
      nonOmsCriteria: [
        { text: "Must have completed all required programming and treatment" },
        {
          text: "Must have completed court-ordered restitution payments",
          tooltip:
            "The client has not willfully failed to pay restitution or crime victim assessment(s)",
        },
        {
          text: "Must have paid or made a good faith effort to pay restitution, fees, court costs, fines, and other monetary obligations",
          tooltip:
            "The client has not willfully failed to pay monetary obligations. Unless another standard is prescribed by the court, the Agent shall not regard the offender's failure to pay as willful if any of the following apply: \n1. The client provides documentation of disability and has little or no income. \n2. The client is on public assistance. \n3. The client has been unemployed for the majority of the probation term despite earnest job-seeking efforts and has little or no income from any other source. \n4. The client annual income is at or below the federal poverty guidelines (refer to the information at https://aspe.hhs.gov). \n5. The client net income is above federal poverty guidelines but has been and remains insufficient to satisfy the terms of the obligations ordered. \n6. The client has made earnest efforts to fulfill payment obligations, but the amount owed is such that complete payment within the scheduled probation term is unrealistic.",
        },
        { text: "Must have no pending felony charges or warrants" },
      ],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "UsMiEarlyDischargeIcDetails",
        "ClientProfileDetails",
        "EligibilityDate",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MI",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Early Discharge is the termination of the period of probation or parole before the full-term discharge date. Early discharge reviews are mandated, at minimum, once clients have served half of their original term of supervision.<br /><br />Review clients who may be eligible for early discharge as per OP 06.05.135 and OP 06.04.130H and complete the discharge paperwork in COMS.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "earlyDischarge",
      zeroGrantsTooltip: null,
    },
    usMiMinimumTelephoneReporting: {
      callToAction:
        "Review clients who meet the requirements for minimum telephone reporting and change supervision levels in COMS.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "FIREARM",
          text: "Serving on a felony offense involving possession or use of a firearm",
        },
        {
          key: "SPEC COURT",
          text: "Enrolled in a special issue court (e.g. Drug Treatment Court, Recovery Court, MH Court, Veterans Court)",
        },
        {
          key: "RPOSN",
          text: "Designated as Reentry Project for Offenders with Special Needs (RPOSN - D-47)",
        },
        {
          key: "HIGH PROFILE",
          text: "Currently serving for an offense that resulted in the death of a person or a high-profile case with adverse community reaction (requires Max or higher based on risk score)",
        },
        {
          key: "JUDGE",
          text: "County Judge declined client for consideration",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Minimum Telephone Reporting",
      dynamicEligibilityText:
        "client[|s] may be eligible for downgrade to a minimum telephone reporting",
      eligibilityDateText:
        "Earliest Eligibility Date for Minimum Telephone Reporting",
      eligibleCriteriaCopy: [
        {
          key: "onMinimumSupervisionAtLeastSixMonths",
          text: "Served at least six months on Minimum In-Person or Minimum Low Risk supervision",
          tooltip:
            "Offenders assigned to minimum in person or minimum low-risk supervision shall be evaluated for assignment to minimum TRS after they have completed six months of active supervision.",
        },
        {
          key: "usMiSupervisionAndAssessmentLevelEligibleForTelephoneReporting",
          text: "Has eligible original COMPAS score of {{titleCase initialAssessmentLevel}}",
          tooltip:
            "Original COMPAS score was minimum or medium and current supervision level is minimum in person or current supervision level is minimum low risk.",
        },
        {
          key: "usMiNotRequiredToRegisterUnderSora",
          text: "Not required to register per SORA",
          tooltip:
            "Not currently required to register pursuant to to the Sex Offender Registration Act.",
        },
        {
          key: "usMiNotServingIneligibleOffensesForTelephoneReporting",
          text: "Not on supervision for an offense excluded from eligibility for telephone reporting",
          tooltip:
            "Not currently serving for an offense listed in WS 01.06.115 Attachment A “Michigan Sex Offender Registry Offenses” or any any similar offense from another state. Not currently serving for an offense included in OP 06.04.130K Attachment A “TRS Exclusion List” including Attempts, Solicitation and Conspiracy. Agents should reference the PACC code on the list when determining eligibility. Not serving for Operating Under the Influence of Liquor (OUIL) or Operating While Impaired (OWI) (any level), unless the offender has successfully completed twelve months of active supervision. A probationer currently serving for OUIL/OWI may only be placed on TRS if authorized by the sentencing court and documented by a court order. Not serving a life or commuted sentence. Not serving a probation term with a delay of sentence.",
        },
        {
          key: "supervisionNotPastFullTermCompletionDateOrUpcoming90Days",
          text: "More than 90 days remaining until full-term discharge.",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_MI-minimumTelephoneReporting",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 3,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "EligibilityDate"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MI",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Minimum Telephone Reporting is a level of supervision that uses an interactive voice recognition system, rather than requiring regular face-to-face contacts.<br /><br />Review clients who meet the requirements for minimum telephone reporting as per OP 06.04.130K and transfer them to telephone reporting in COMS.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "minimumTelephoneReporting",
      zeroGrantsTooltip: null,
    },
    usMiPastFTRD: {
      callToAction:
        "Review clients who are nearing or past their full-term release date and complete discharges in COMS.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "DATE", text: "Expiration date is inaccurate" },
        { key: "CUSTODY", text: "Client is currently in custody" },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Overdue for Discharge",
      dynamicEligibilityText:
        "client[|s] [is|are] nearing or past their full-term release date",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "supervisionPastFullTermCompletionDate",
          text: "{{daysPast eligibleDate}} days past FTRD ({{date eligibleDate}})",
          tooltip: null,
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_MI-pastFTRDReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 4,
      ineligibleCriteriaCopy: [
        {
          key: "supervisionPastFullTermCompletionDate",
          text: "{{daysUntil eligibleDate}} days until FTRD ({{date eligibleDate}})",
          tooltip: null,
        },
      ],
      initialHeader: null,
      isAlert: true,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: {
        autoSnoozeParams: { params: { days: 30 }, type: "snoozeDays" },
      },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MI",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify supervision clients who are past their full-term release date and directs staff to complete the discharge in COMS.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for discharge",
      urlSection: "pastFTRD",
      zeroGrantsTooltip: null,
    },
    usMiReclassificationRequest: {
      callToAction:
        "Return residents eligible for reclassification to general population",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "ALJ",
          text: "Administrative Law Judge found reasonable cause for delay at a hearing conducted on a Class I misconduct violation or on proposed placement in administrative segregation",
        },
        {
          key: "HIGHER SECURITY",
          text: "Classified to ad seg or higher security level but awaiting transfer to a facility with such housing [LOS should not exceed 30 days]",
        },
        {
          key: "TRANSFER",
          text: "Awaiting transfer to a facility that can meet protection or physical/mental health needs",
        },
        { key: "PREA", text: "Part of a PREA investigation" },
        {
          key: "DETENTION",
          text: "Awaiting transfer to a facility with detention cells to serve a sanction",
        },
        {
          key: "MEDICAL",
          text: "Medically quarantined, no single cells available",
        },
        {
          key: "PAROLEE",
          text: "Parolee at DRC awaiting parole revocation hearings",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Reclassification to General Population",
      dynamicEligibilityText:
        "resident[|s] in temporary segregation or detention [is|are] eligible for reclassification to general population",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usMiEligibleForReclassificationFromSolitaryToGeneral",
          text: '{{#if (eq record.metadata.solitaryConfinementType "DISCIPLINARY_SOLITARY_CONFINEMENT")}}Length of stay in detention {{record.metadata.daysInSolitary}} days, {{daysPast sanctionExpirationDate}} days beyond original detention sanction{{else}}Length of stay in temporary segregation {{record.metadata.daysInSolitary}} days, exceeding 30-day policy requirement{{/if}}',
          tooltip:
            '{{#if (eq record.metadata.solitaryConfinementType "DISCIPLINARY_SOLITARY_CONFINEMENT")}}A prisoner shall not remain on detention status for longer than the period of time ordered by the ALJ{{else}}Wardens shall ensure that prisoners are not confined in temporary segregation for more than seven business days except under the circumstances listed in 1-7 below{{/if}}',
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_MI-reclassificationRequest",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 6,
      ineligibleCriteriaCopy: [
        {
          key: "usMiEligibleForReclassificationFromSolitaryToGeneral",
          text: "Length of stay in temporary segregation {{record.metadata.daysInSolitary}} days, exceeding 7-day policy requirement",
          tooltip:
            "Wardens shall ensure that prisoners are not confined in temporary segregation for more than seven business days except under the circumstances listed in 1-7 below",
        },
      ],
      initialHeader:
        "Return residents eligible for reclassification to general population.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 30 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MI",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents in temporary segregation or detention who may be eligible to return to general population, including residents who have served their full detention sanction and residents who have been in temporary segregation for longer than the seven day threshold stipulated by policy. Review eligible and overdue clients and work to transfer them back to general population. See frequently asked questions [here](https://drive.google.com/file/d/1aqHekX0rxCYc1U1KZdo-nK3ZS62pjKuR/view?usp=sharing).",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "reclassificationRequest",
      zeroGrantsTooltip: null,
    },
    usMiSecurityClassificationCommitteeReview: {
      callToAction:
        "Complete SCC review and fill out 283 Form for eligible residents",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "PRIOR RH",
          text: "Prior restrictive housing history requires management at more restrictive level",
        },
        {
          key: "PLACING BEHAVIOR",
          text: "Severe placing behavior necessitates longer stay in segregation",
        },
        { key: "RESPECT", text: "Fails to be cordial and respectful to staff" },
        {
          key: "ATTITUDE",
          text: "Behavior and attitude not consistent with general population expectations",
        },
        { key: "MISCONDUCTS", text: "Misconduct(s) filed during segregation" },
        {
          key: "GP NOT APPROPRIATE",
          text: "Unable to honor trust implicit in less restrictive environment ",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Security Classification Committee Review",
      dynamicEligibilityText:
        "resident[|s] [is|are] eligible for SCC review to potentially return to general population",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usMiPastSecurityClassificationCommitteeReviewDate",
          text: "{{record.metadata.daysInCollapsedSolitarySession}} consecutive days in restrictive housing;{{#if latestSccReviewDate}} last SCC review recorded on {{date latestSccReviewDate}};{{/if}} SCC review due on or before {{date nextSccDate}}",
          tooltip:
            "A housing unit team review shall be conducted within seven calendar days of the prisoner being classified to administrative segregation. SCC shall review the prisoner at least every 30 calendar days thereafter until the prisoner is reclassified to general population status.",
        },
        {
          key: "housingUnitTypeIsSolitaryConfinement",
          text: "Currently in {{usMiSegregationDisplayName record.formInformation.segregationType}}",
          tooltip:
            '{{#if (eq record.formInformation.segregationType "ADMINISTRATIVE_SOLITARY_CONFINEMENT")}}Housing unit team members and SCC shall regularly review the behavioral adjustment of each prisoner classified to administrative segregation, including prisoners classified to administrative segregation who are serving a detention sanction for misconduct.{{else if (eq record.formInformation.segregationType "TEMPORARY_SOLITARY_CONFINEMENT")}}If the prisoner is held in temporary segregation for more than 30 calendar days, the facility shall afford the prisoner a review to determine whether there is a continuing need for separation.{{/if}}',
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_MI-securityClassificationCommitteeReview",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 7,
      ineligibleCriteriaCopy: [
        {
          key: "usMiPastSecurityClassificationCommitteeReviewDate",
          text: "Next SCC review due next week, on or before {{date nextSccDate}}",
          tooltip:
            "A housing unit team review shall be conducted within seven calendar days of the prisoner being classified to administrative segregation. SCC shall review the prisoner at least every 30 calendar days thereafter until the prisoner is reclassified to general population status.",
        },
      ],
      initialHeader:
        "Complete SCC review and fill out 283 Form for eligible residents.",
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "UsMiRestrictiveHousing",
        "CaseNotes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 30 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MI",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents in restrictive housing who are due for a Security Classification Committee (SCC) Review, which is to be conducted within 7 calendar days of being classified to restrictive housing and every 30 days thereafter. Complete an SCC review and fill out the pre-filled 283 Form for eligible residents. Where possible, work to transfer residents who no longer need to be in temporary or administrative segregation back to general population. See frequently asked questions [here](https://drive.google.com/file/d/1aqHekX0rxCYc1U1KZdo-nK3ZS62pjKuR/view?usp=sharing).",
      submittedTabTitle: "Pending",
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Overdue",
            "Due now",
            "Upcoming",
            "Marked Ineligible",
            "Pending",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "securityClassificationCommitteeReview",
      zeroGrantsTooltip: null,
    },
    usMiSupervisionLevelDowngrade: {
      callToAction:
        "Review clients whose supervision level does not match their risk level and change supervision levels in COMS.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "OVERRIDE",
          text: "Agent supervision level override due to noncompliance with supervision",
        },
        {
          key: "EXCLUDED CHARGE",
          text: "Client is required to be supervised at a higher level of supervision by policy",
        },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Supervision Level Mismatch",
      dynamicEligibilityText:
        "client[|s] within their first 6 months of supervision [is|are] being supervised at a level that does not match their latest risk score",
      eligibilityDateText: "Initial Classification Due Date",
      eligibleCriteriaCopy: [
        {
          key: "supervisionLevelHigherThanAssessmentLevel",
          text: "Currently supervised at {{supervisionLevel}}; Latest COMPAS score is {{assessmentLevel}}",
          tooltip:
            "The supervising Agent shall ensure that a Correctional Offender Management Profiling for Alternative Sanctions (COMPAS) has been completed for each offender on their active caseload as outlined in OP 06.01.145 “Administration and Use of COMPAS and TAP.”  Unless mandated by statute or other criteria as directed in this operating procedure, the COMPAS shall be used to determine the initial supervision level of each offender.  Any offender placed on active supervision without a completed COMPAS shall be supervised at a Medium level of supervision until a COMPAS can be completed (unless a higher level of supervision is mandated as outlined in this operating procedure).",
        },
        {
          key: "usMiNotPastInitialClassificationReviewDate",
          text: "Initial classification review date is upcoming",
          tooltip:
            "Classification reviews shall be completed after six months of active supervision.  Unless an offender’s supervision level is mandated by policy or statute, the supervising Agent shall reduce an offender’s supervision level if the offender has satisfactorily completed six continuous months at the current assigned supervision level.",
        },
        {
          key: "usMiNotServingIneligibleOffensesForDowngradeFromSupervisionLevel",
          text: "Not serving for an offense ineligible for a lower supervision level",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_MI-supervisionLevelDowngrade",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 5,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: true,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "ClientProfileDetails",
        "EligibilityDate",
        "CaseNotes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MI",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify clients who are eligible for a downgrade in their supervision level during their first six months on supervision. The tool will surface clients who have not yet received a COMPAS but are being supervised at a level other than medium or whose supervision level is not aligned with their COMPAS score.<br /><br />Review clients within their first six months of supervision and whose supervision level does not match their risk level as per OP 06.04.130I and downgrade their supervision level in COMS.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "supervisionLevelMismatch",
      zeroGrantsTooltip: null,
    },
    usMiWardenInPersonSecurityClassificationCommitteeReview: {
      callToAction:
        "Complete SCC review and fill out 283 Form for eligible residents, inclusive of Warden signature.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "PRIOR RH",
          text: "Prior restrictive housing history requires management at more restrictive level",
        },
        {
          key: "PLACING BEHAVIOR",
          text: "Severe placing behavior necessitates longer stay in segregation",
        },
        { key: "RESPECT", text: "Fails to be cordial and respectful to staff" },
        {
          key: "ATTITUDE",
          text: "Behavior and attitude not consistent with general population expectations",
        },
        { key: "MISCONDUCTS", text: "Misconduct(s) filed during segregation" },
        {
          key: "GP NOT APPROPRIATE",
          text: "Unable to honor trust implicit in less restrictive environment ",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Warden In-Person Review",
      dynamicEligibilityText:
        "resident[|s] [is|are] eligible for in-person review by the Warden at SCC to potentially return to general population",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usMiPastWardenInPersonReviewForSccDate",
          text: "{{record.metadata.daysInCollapsedSolitarySession}} consecutive days in restrictive housing;{{#if latestWardenInPersonSccReviewDate}} last Warden in-person review recorded on {{date latestWardenInPersonSccReviewDate}};{{/if}} Warden in-person review due on or before {{date nextSccDate}}",
          tooltip:
            "Wardens shall personally interview each prisoner in their respective facilities who has been confined in administrative segregation for six continuous months. If the prisoner continues in administrative segregation beyond the first six month period, the Warden shall interview the prisoner every six months thereafter until the prisoner is released from administrative segregation.",
        },
        {
          key: "usMiInSolitaryConfinementAtLeastSixMonths",
          text: "Currently in {{usMiSegregationDisplayName record.formInformation.segregationType}}",
          tooltip:
            '{{#if (eq record.formInformation.segregationType "ADMINISTRATIVE_SOLITARY_CONFINEMENT")}}Housing unit team members and SCC shall regularly review the behavioral adjustment of each prisoner classified to administrative segregation, including prisoners classified to administrative segregation who are serving a detention sanction for misconduct.{{else if (eq record.formInformation.segregationType "TEMPORARY_SOLITARY_CONFINEMENT")}}If the prisoner is held in temporary segregation for more than 30 calendar days, the facility shall afford the prisoner a review to determine whether there is a continuing need for separation.{{/if}}',
        },
      ],
      emptyTabCopy: [],
      firestoreCollection:
        "US_MI-wardenInPersonSecurityClassificationCommitteeReview",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 7,
      ineligibleCriteriaCopy: [
        {
          key: "usMiPastWardenInPersonReviewForSccDate",
          text: "Next Warden in-person review due in the next two months, on or before {{date nextSccDate}}",
          tooltip:
            "Wardens shall personally interview each prisoner in their respective facilities who has been confined in administrative segregation for six continuous months. If the prisoner continues in administrative segregation beyond the first six month period, the Warden shall interview the prisoner every six months thereafter until the prisoner is released from administrative segregation.",
        },
        {
          key: "usMiInSolitaryConfinementAtLeastSixMonths",
          text: "In restrictive housing for {{daysToYearsMonthsPast record.metadata.daysInCollapsedSolitarySession}}",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "UsMiRestrictiveHousing",
        "CaseNotes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 30 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_MI",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify residents in restrictive housing who have spent 6+ consecutive months in segregation and are therefore due for an in-person SCC review with the Warden. Complete SCC review and fill out pre-filled 283 Form for eligible residents, inclusive of Warden signature. Where possible, work to transfer residents who no longer need to be in temporary or administrative segregation back to general population. See frequently asked questions [here](https://drive.google.com/file/d/1aqHekX0rxCYc1U1KZdo-nK3ZS62pjKuR/view?usp=sharing).",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: [
            "Overdue",
            "Due now",
            "Upcoming",
            "Marked Ineligible",
            "Pending",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "wardenInPersonSecurityClassificationCommitteeReview",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
