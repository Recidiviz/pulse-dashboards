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
      usMiAddInPersonSecurityClassificationCommitteeReview: {
        callToAction:
          "Complete SCC review and fill out 283 Form for eligible residents, inclusive of ADD signature.",
        compareBy: null,
        denialReasons: {
          ATTITUDE:
            "Behavior and attitude not consistent with general population expectations",
          "GP NOT APPROPRIATE":
            "Unable to honor trust implicit in less restrictive environment ",
          MISCONDUCTS: "Misconduct(s) filed during segregation",
          Other: "Other, please specify a reason",
          "PLACING BEHAVIOR":
            "Severe placing behavior necessitates longer stay in segregation",
          "PRIOR RH":
            "Prior restrictive housing history requires management at more restrictive level",
          RESPECT: "Fails to be cordial and respectful to staff",
        },
        denialText: null,
        displayName: "ADD In-Person Review",
        dynamicEligibilityText:
          "resident[|s] [is|are] eligible for in-person review by the ADD at SCC to potentially return to general population",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          usMiInSolitaryConfinementAtLeastOneYear: {
            text: "Currently in {{usMiSegregationDisplayName record.formInformation.segregationType}}",
            tooltip:
              '{{#if (eq record.formInformation.segregationType "ADMINISTRATIVE_SOLITARY_CONFINEMENT")}}Housing unit team members and SCC shall regularly review the behavioral adjustment of each prisoner classified to administrative segregation, including prisoners classified to administrative segregation who are serving a detention sanction for misconduct.{{else if (eq record.formInformation.segregationType "TEMPORARY_SOLITARY_CONFINEMENT")}}If the prisoner is held in temporary segregation for more than 30 calendar days, the facility shall afford the prisoner a review to determine whether there is a continuing need for separation.{{/if}}',
          },
          usMiPastAddInPersonReviewForSccDate: {
            text: "{{record.metadata.daysInCollapsedSolitarySession}} consecutive days in restrictive housing;{{#if latestADDInPersonSccReviewDate}} last ADD in-person review recorded on {{date latestADDInPersonSccReviewDate}};{{/if}} ADD in-person review due on or before {{date nextSccDate}}",
            tooltip:
              "ADDs shall personally interview each prisoner in their respective regions who has been confined in administrative segregation for twelve continuous months. If the prisoner continues in administrative segregation beyond the first twelve month period, the ADD shall interview the prisoner every twelve months thereafter until the prisoner is released from administrative segregation.",
          },
        },
        firestoreCollection:
          "US_MI-addInPersonSecurityClassificationCommitteeReview",
        hideDenialRevert: false,
        homepagePosition: 8,
        ineligibleCriteriaCopy: {
          usMiInSolitaryConfinementAtLeastOneYear: {
            text: "In restrictive housing for {{daysToYearsMonthsPast record.metadata.daysInCollapsedSolitarySession}}",
          },
          usMiPastAddInPersonReviewForSccDate: {
            text: "Next ADD in-person review due in the next two months, on or before {{date nextSccDate}}",
            tooltip:
              "ADDs shall personally interview each prisoner in their respective regions who has been confined in administrative segregation for twelve continuous months. If the prisoner continues in administrative segregation beyond the first twelve month period, the ADD shall interview the prisoner every twelve months thereafter until the prisoner is released from administrative segregation.",
          },
        },
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: [
          "Incarceration",
          "UsMiRestrictiveHousing",
          "CaseNotes",
        ],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 30 },
        stateCode: "US_MI",
        subheading:
          "This alert helps staff identify residents in restrictive housing who have spent 1+ consecutive year(s) in segregation and are therefore due for an in-person SCC review with the relevant ADD. Complete an SCC review and fill out the pre-filled 283 Form for eligible residents, inclusive of ADD signature. Where possible, work to transfer residents who no longer need to be in temporary or administrative segregation back to general population.",
        systemType: "INCARCERATION",
        tabGroups: {
          "ELIGIBILITY STATUS": [
            "Overdue",
            "Due now",
            "Upcoming",
            "Marked Ineligible",
          ],
        },
        tooltipEligibilityText: null,
        urlSection: "addInPersonSecurityClassificationCommitteeReview",
      },
      usMiClassificationReview: {
        callToAction:
          "Review clients who meet the time threshold for classification review and downgrade supervision levels in COMS.",
        compareBy: null,
        denialReasons: {
          ABSCONSION: "Chronic missing of reporting dates",
          "CASE PLAN":
            "No progress toward completion of Transition Accountability Plan goals/tasks",
          EMPLOYMENT:
            "Chronic unemployment with no effort to job search or recent, concerning unemployment",
          "FINES & FEES":
            "No effort to pay fines and fees despite documented ability to pay",
          NONCOMPLIANT: "Noncompliant with the order of supervision",
          Other: "Other: please specify a reason",
          VIOLATIONS:
            "Excessive violation behavior during current review period",
        },
        denialText: null,
        displayName: "Classification Review",
        dynamicEligibilityText:
          "client[|s] may be eligible for a supervision level downgrade",
        eligibilityDateText: "Next Classification Due Date",
        eligibleCriteriaCopy: {
          usMiClassificationReviewPastDueDate: {
            text: "Recommended classification review date, based on supervision start date and last classification review date, is {{date eligibleDate}}",
            tooltip:
              "Classification reviews shall be completed after six months of active supervision […] Subsequent classification reviews shall be scheduled at six-month intervals.",
          },
          usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
            text: "Currently eligible based on offense type and supervision level",
            tooltip:
              "The supervising Agent shall ensure that a Correctional Offender Management Profiling for Alternative Sanctions (COMPAS) has been completed for each offender on their active caseload as outlined in OP 06.01.145 “Administration and Use of COMPAS and TAP.” Unless mandated by statute or other criteria as directed in this operating procedure, the COMPAS shall be used to determine the initial supervision level of each offender.\nUnless an offender’s supervision level is mandated by policy or statute, the supervising Agent shall reduce an offender’s supervision level if the offender has satisfactorily completed six continuous months at the current assigned supervision level.",
          },
        },
        firestoreCollection: "US_MI-classificationReviewReferrals",
        hideDenialRevert: false,
        homepagePosition: 1,
        ineligibleCriteriaCopy: {},
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
        notifications: [],
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
        stateCode: "US_MI",
        subheading:
          "This alert helps staff identify clients due or overdue for a classification review, which are generally mandated after six months of supervision and at six-month intervals thereafter, though some clients must receive a classification review earlier than six months by policy. Agents may reconsider the supervision level for a client based on developments in their case and behavior; per FOA Field Memorandum 2023-211, agents are presumptively required to downgrade clients’ supervision level during each classification review, provided that they have “satisfactorily completed” the prior six months on supervision. Review clients who meet the time threshold for classification review and downgrade their supervision level in COMS.",
        systemType: "SUPERVISION",
        tabGroups: null,
        tooltipEligibilityText: null,
        urlSection: "classificationReview",
      },
      usMiEarlyDischarge: {
        callToAction:
          "Review clients who may be eligible for early discharge and complete discharge paperwork in COMS.",
        compareBy: null,
        denialReasons: {
          "CHILD ABUSE ORDER":
            "CHILD ABUSE ORDER: Child abuse prevention order filed during supervision period",
          "EXCLUDED OFFENSE":
            "EXCLUDED OFFENSE: On parole for an offense resulting in death or serious bodily injury or an offense involving the discharge of a firearm",
          "FELONY/STATE PROBATION":
            "FELONY/STATE PROBATION: On parole and also on other state or federal probation supervision for an offense committed during the current period",
          "FINES & FEES":
            "FINES & FEES: Willful nonpayment of restitution, fees, court costs, fines, and other monetary obligations despite clear ability to pay",
          JUDGE: "JUDGE: County Judge declined client for consideration",
          NEEDS:
            "NEEDS: On parole and all criminogenic needs have not been addressed",
          NONCOMPLIANT:
            "NONCOMPLIANT: Not compliant with the order of supervision",
          "ORDERED TREATMENT":
            "ORDERED TREATMENT: Has not completed all required treatment",
          Other: "Other: please specify a reason",
          "PENDING CHARGES": "PENDING CHARGES: Pending felony charges/warrant",
          "PRO-SOCIAL": "PRO-SOCIAL: Has not demonstrated pro-social behavior",
          PROGRAMMING:
            "PROGRAMMING: Has not completed all required programming",
          RESTITUTION:
            "RESTITUTION: Has not completed court-ordered restitution payments",
          "SUSPECTED OFFENSE":
            "SUSPECTED OFFENSE: Suspected of a felony, assaultive misdemeanor, OWI, or offense requiring SORA registration",
        },
        denialText: null,
        displayName: "Early Discharge",
        dynamicEligibilityText:
          "client[|s] may be eligible for early discharge",
        eligibilityDateText: "Earliest Eligibility Date for Early Discharge",
        eligibleCriteriaCopy: {
          servingAtLeastOneYearOnParoleSupervisionOrSupervisionOutOfState: {
            text: "Serving a parole term of 12 months or more",
            tooltip:
              "A parolee is eligible for early discharge consideration prior to the expiration of the original term of parole if they have completed at least one-half of an original parole term of 12 months or more",
          },
          supervisionOrSupervisionOutOfStateLevelIsNotHigh: {
            text: "Not on intensive supervision",
          },
          supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: {
            text: 'Completed at least half of {{#if (eq record.metadata.supervisionType "Parole")}}parole{{else}}probation{{/if}} term',
            tooltip:
              '{{#if (eq record.metadata.supervisionType "Parole")}}A parolee is eligible for early discharge consideration prior to the expiration of the original term of parole if they have completed at least one-half of an original parole term of 12 months or more{{else}}An offender may be considered for discharge prior to the expiration of the original term of probation if they have completed at least one-half of the probation term{{/if}}',
          },
          usMiNoActivePpo: {
            text: 'No active PPO ordered during the {{#if (eq record.metadata.supervisionType "Parole")}}parole{{else}}probation{{/if}} term',
            tooltip:
              'The {{#if (eq record.metadata.supervisionType "Parole")}}parolee{{else}}offender{{/if}} does not have an active PPO […] that was ordered against him/her during the {{#if (eq record.metadata.supervisionType "Parole")}}parole{{else}}probation{{/if}} term.',
          },
          usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: {
            text: 'Not involved in a felony, assaultive misdemeanor, or offense requiring SORA registration while on {{#if (eq record.metadata.supervisionType "Parole")}}parole{{else}}probation{{/if}}',
            tooltip:
              '{{#if (eq record.metadata.supervisionType "Parole")}}The parolee is not known to have been involved in […] felonious behavior, assaultive misdemeanor behavior (as set forth in Attachment A) […] or an offense that requires registration under the Sex Offender Registration Act while on parole.{{else}}The offender is not known to have been involved in […] felonious behavior or assaultive misdemeanor behavior as set forth in Attachment A “OP 06.01.145B Assaultive Misdemeanor List” which occurred while on probation or any offense that requires registration under the Sex Offender Registration Act (SORA), which occurred while on probation.{{/if}}',
          },
          usMiNoOwiViolationOnParoleDualSupervision: {
            text: "Not involved in an OWI offense while on parole.",
            tooltip:
              "The parolee is not known to have been involved in […] a violation of MCL 257.625 (OWI) […] while on parole.",
          },
          usMiNoPendingDetainer: { text: "No pending detainers" },
          usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision:
            {
              text: "Not serving for an offense excluded from early discharge eligibility by policy.",
              tooltip:
                "The parolee is not serving for an offense […] required to be registered under the Sex Offender Registration Act.",
            },
          usMiNotServingIneligibleOffensesForEarlyDischargeFromProbationSupervision:
            {
              text: "Not serving for an offense excluded from early discharge eligibility by policy.",
              tooltip:
                "The offender is not currently serving for an offense that requires a mandatory term of probation as identified in Paragraph H. The offender is not currently serving for MCL 750.81 or MCL 750.84 (Assault with Intent to commit Great Bodily Harm Less than Murder).",
            },
          usMiParoleDualSupervisionPastEarlyDischargeDate: {
            text: "Served mandatory period of parole",
            tooltip:
              "The parolee has served any mandatory period of parole as set forth in Paragraph F. ",
          },
          usMiSupervisionOrSupervisionOutOfStateLevelIsNotSai: {
            text: "Not paroled from SAI on current term",
            tooltip:
              "The parolee was not paroled from the Special Alternative Incarceration (SAI) program on the current term (see definition).",
          },
        },
        firestoreCollection: "US_MI-earlyDischargeReferrals",
        hideDenialRevert: false,
        homepagePosition: 2,
        ineligibleCriteriaCopy: {},
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: [
          "UsMiEarlyDischargeIcDetails",
          "ClientProfileDetails",
          "EligibilityDate",
        ],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
        stateCode: "US_MI",
        subheading:
          "Early discharge is the termination of the period of probation or parole before the full-term discharge date. Early discharge reviews are mandated, at minimum, once clients have served half of their original term of supervision. Review clients who may be eligible for early discharge and complete discharge paperwork in COMS.",
        systemType: "SUPERVISION",
        tabGroups: null,
        tooltipEligibilityText: null,
        urlSection: "earlyDischarge",
      },
      usMiMinimumTelephoneReporting: {
        callToAction:
          "Review clients who meet the requirements for minimum telephone reporting and change supervision levels in COMS.",
        compareBy: null,
        denialReasons: {
          FIREARM:
            "Serving on a felony offense involving possession or use of a firearm",
          "HIGH PROFILE":
            "Currently serving for an offense that resulted in the death of a person or a high-profile case with adverse community reaction (requires Max or higher based on risk score)",
          JUDGE: "County Judge declined client for consideration",
          Other: "Other, please specify a reason",
          RPOSN:
            "Designated as Reentry Project for Offenders with Special Needs (RPOSN - D-47)",
          "SPEC COURT":
            "Enrolled in a special issue court (e.g. Drug Treatment Court, Recovery Court, MH Court, Veterans Court)",
        },
        denialText: null,
        displayName: "Minimum Telephone Reporting",
        dynamicEligibilityText:
          "client[|s] may be eligible for downgrade to a minimum telephone reporting",
        eligibilityDateText:
          "Earliest Eligibility Date for Minimum Telephone Reporting",
        eligibleCriteriaCopy: {
          onMinimumSupervisionAtLeastSixMonths: {
            text: "Served at least six months on Minimum In-Person or Minimum Low Risk supervision",
            tooltip:
              "Offenders assigned to minimum in person or minimum low-risk supervision shall be evaluated for assignment to minimum TRS after they have completed six months of active supervision.",
          },
          supervisionNotPastFullTermCompletionDateOrUpcoming90Days: {
            text: "More than 90 days remaining until full-term discharge.",
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
          usMiSupervisionAndAssessmentLevelEligibleForTelephoneReporting: {
            text: "Original COMPAS score was {{titleCase initialAssessmentLevel}}",
            tooltip:
              "Original COMPAS score was minimum or medium and current supervision level is minimum in person or current supervision level is minimum low risk.",
          },
        },
        firestoreCollection: "US_MI-minimumTelephoneReporting",
        hideDenialRevert: false,
        homepagePosition: 3,
        ineligibleCriteriaCopy: {},
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: ["ClientProfileDetails", "EligibilityDate"],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
        stateCode: "US_MI",
        subheading:
          "Minimum Telephone Reporting is a level of supervision that uses an interactive voice recognition system, rather than requiring regular face-to-face contacts. Review clients who meet the requirements for minimum telephone reporting and transfer them to telephone reporting in COMS.",
        systemType: "SUPERVISION",
        tabGroups: null,
        tooltipEligibilityText: null,
        urlSection: "minimumTelephoneReporting",
      },
      usMiPastFTRD: {
        callToAction:
          "Review clients who are nearing or past their full-term release date and complete discharges in COMS.",
        compareBy: null,
        denialReasons: {
          CUSTODY: "Client is currently in custody",
          DATE: "Expiration date is inaccurate",
          Other: "Other: please specify a reason",
        },
        denialText: null,
        displayName: "Overdue for Discharge",
        dynamicEligibilityText:
          "client[|s] [is|are] nearing or past their full-term release date",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          supervisionPastFullTermCompletionDate: {
            text: "{{daysPast eligibleDate}} days past FTRD ({{date eligibleDate}})",
          },
        },
        firestoreCollection: "US_MI-pastFTRDReferrals",
        hideDenialRevert: false,
        homepagePosition: 4,
        ineligibleCriteriaCopy: {
          supervisionPastFullTermCompletionDate: {
            text: "{{daysUntil eligibleDate}} days until FTRD ({{date eligibleDate}})",
          },
        },
        initialHeader: null,
        isAlert: true,
        methodologyUrl:
          "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: ["ClientProfileDetails"],
        snooze: {
          autoSnoozeParams: { params: { days: 30 }, type: "snoozeDays" },
        },
        stateCode: "US_MI",
        subheading:
          "This alert helps staff identify supervision clients who are past their full-term release date and directs staff to complete the discharge in COMS.",
        systemType: "SUPERVISION",
        tabGroups: null,
        tooltipEligibilityText: "Eligible for discharge",
        urlSection: "pastFTRD",
      },
      usMiReclassificationRequest: {
        callToAction:
          "Return residents eligible for reclassification to general population",
        compareBy: null,
        denialReasons: {
          ALJ: "Administrative Law Judge found reasonable cause for delay at a hearing conducted on a Class I misconduct violation or on proposed placement in administrative segregation",
          DETENTION:
            "Awaiting transfer to a facility with detention cells to serve a sanction",
          "HIGHER SECURITY":
            "Classified to ad seg or higher security level but awaiting transfer to a facility with such housing [LOS should not exceed 30 days]",
          MEDICAL: "Medically quarantined, no single cells available",
          Other: "Other, please specify a reason",
          PAROLEE: "Parolee at DRC awaiting parole revocation hearings",
          PREA: "Part of a PREA investigation",
          TRANSFER:
            "Awaiting transfer to a facility that can meet protection or physical/mental health needs",
        },
        denialText: null,
        displayName: "Reclassification to General Population",
        dynamicEligibilityText:
          "resident[|s] in temporary segregation or detention [is|are] eligible for reclassification to general population",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          usMiEligibleForReclassificationFromSolitaryToGeneral: {
            text: '{{#if (eq record.metadata.solitaryConfinementType "DISCIPLINARY_SOLITARY_CONFINEMENT")}}Length of stay in detention {{record.metadata.daysInSolitary}} days, {{daysPast sanctionExpirationDate}} days beyond original detention sanction{{else}}Length of stay in temporary segregation {{record.metadata.daysInSolitary}} days, exceeding 30-day policy requirement{{/if}}',
            tooltip:
              '{{#if (eq record.metadata.solitaryConfinementType "DISCIPLINARY_SOLITARY_CONFINEMENT")}}A prisoner shall not remain on detention status for longer than the period of time ordered by the ALJ{{else}}Wardens shall ensure that prisoners are not confined in temporary segregation for more than seven business days except under the circumstances listed in 1-7 below{{/if}}',
          },
        },
        firestoreCollection: "US_MI-reclassificationRequest",
        hideDenialRevert: false,
        homepagePosition: 6,
        ineligibleCriteriaCopy: {
          usMiEligibleForReclassificationFromSolitaryToGeneral: {
            text: "Length of stay in temporary segregation {{record.metadata.daysInSolitary}} days, exceeding 7-day policy requirement",
            tooltip:
              "Wardens shall ensure that prisoners are not confined in temporary segregation for more than seven business days except under the circumstances listed in 1-7 below",
          },
        },
        initialHeader:
          "Return residents eligible for reclassification to general population.",
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: ["Incarceration"],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 30 },
        stateCode: "US_MI",
        subheading:
          "This alert helps staff identify residents in temporary segregation or detention who may be eligible to return to general population, including residents who have served their full detention sanction and residents who have been in temporary segregation for longer than the seven day threshold stipulated by policy. Review eligible and overdue clients and work to transfer them back to general population.",
        systemType: "INCARCERATION",
        tabGroups: null,
        tooltipEligibilityText: null,
        urlSection: "reclassificationRequest",
      },
      usMiSecurityClassificationCommitteeReview: {
        callToAction:
          "Complete SCC review and fill out 283 Form for eligible residents",
        compareBy: null,
        denialReasons: {
          ATTITUDE:
            "Behavior and attitude not consistent with general population expectations",
          "GP NOT APPROPRIATE":
            "Unable to honor trust implicit in less restrictive environment ",
          MISCONDUCTS: "Misconduct(s) filed during segregation",
          Other: "Other, please specify a reason",
          "PLACING BEHAVIOR":
            "Severe placing behavior necessitates longer stay in segregation",
          "PRIOR RH":
            "Prior restrictive housing history requires management at more restrictive level",
          RESPECT: "Fails to be cordial and respectful to staff",
        },
        denialText: null,
        displayName: "Security Classification Committee Review",
        dynamicEligibilityText:
          "resident[|s] [is|are] eligible for SCC review to potentially return to general population",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          housingUnitTypeIsSolitaryConfinement: {
            text: "Currently in {{usMiSegregationDisplayName record.formInformation.segregationType}}",
            tooltip:
              '{{#if (eq record.formInformation.segregationType "ADMINISTRATIVE_SOLITARY_CONFINEMENT")}}Housing unit team members and SCC shall regularly review the behavioral adjustment of each prisoner classified to administrative segregation, including prisoners classified to administrative segregation who are serving a detention sanction for misconduct.{{else if (eq record.formInformation.segregationType "TEMPORARY_SOLITARY_CONFINEMENT")}}If the prisoner is held in temporary segregation for more than 30 calendar days, the facility shall afford the prisoner a review to determine whether there is a continuing need for separation.{{/if}}',
          },
          usMiPastSecurityClassificationCommitteeReviewDate: {
            text: "{{record.metadata.daysInCollapsedSolitarySession}} consecutive days in restrictive housing;{{#if latestSccReviewDate}} last SCC review recorded on {{date latestSccReviewDate}};{{/if}} SCC review due on or before {{date nextSccDate}}",
            tooltip:
              "A housing unit team review shall be conducted within seven calendar days of the prisoner being classified to administrative segregation. SCC shall review the prisoner at least every 30 calendar days thereafter until the prisoner is reclassified to general population status.",
          },
        },
        firestoreCollection: "US_MI-securityClassificationCommitteeReview",
        hideDenialRevert: false,
        homepagePosition: 7,
        ineligibleCriteriaCopy: {
          usMiPastSecurityClassificationCommitteeReviewDate: {
            text: "Next SCC review due next week, on or before {{date nextSccDate}}",
            tooltip:
              "A housing unit team review shall be conducted within seven calendar days of the prisoner being classified to administrative segregation. SCC shall review the prisoner at least every 30 calendar days thereafter until the prisoner is reclassified to general population status.",
          },
        },
        initialHeader:
          "Complete SCC review and fill out 283 Form for eligible residents.",
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: [
          "Incarceration",
          "UsMiRestrictiveHousing",
          "CaseNotes",
        ],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 30 },
        stateCode: "US_MI",
        subheading:
          "This alert helps staff identify residents in restrictive housing who are due for a Security Classification Committee (SCC) Review, which is to be conducted within 7 calendar days of being classified to restrictive housing and every 30 days thereafter. Complete an SCC review and fill out the pre-filled 283 Form for eligible residents. Where possible, work to transfer residents who no longer need to be in temporary or administrative segregation back to general population.",
        systemType: "INCARCERATION",
        tabGroups: {
          "ELIGIBILITY STATUS": [
            "Overdue",
            "Due now",
            "Upcoming",
            "Marked Ineligible",
          ],
        },
        tooltipEligibilityText: null,
        urlSection: "securityClassificationCommitteeReview",
      },
      usMiSupervisionLevelDowngrade: {
        callToAction:
          "Review clients whose supervision level does not match their risk level and change supervision levels in COMS.",
        compareBy: null,
        denialReasons: {
          "EXCLUDED CHARGE":
            "Client is required to be supervised at a higher level of supervision by policy",
          OVERRIDE:
            "Agent supervision level override due to noncompliance with supervision",
          Other: "Other: please specify a reason",
        },
        denialText: null,
        displayName: "Supervision Level Mismatch",
        dynamicEligibilityText:
          "client[|s] within their first 6 months of supervision [is|are] being supervised at a level that does not match their latest risk score",
        eligibilityDateText: "Initial Classification Due Date",
        eligibleCriteriaCopy: {
          supervisionLevelHigherThanAssessmentLevel: {
            text: "Currently supervised at {{supervisionLevel}}; Latest COMPAS score is {{assessmentLevel}}",
            tooltip:
              "The supervising Agent shall ensure that a Correctional Offender Management Profiling for Alternative Sanctions (COMPAS) has been completed for each offender on their active caseload as outlined in OP 06.01.145 “Administration and Use of COMPAS and TAP.”  Unless mandated by statute or other criteria as directed in this operating procedure, the COMPAS shall be used to determine the initial supervision level of each offender.  Any offender placed on active supervision without a completed COMPAS shall be supervised at a Medium level of supervision until a COMPAS can be completed (unless a higher level of supervision is mandated as outlined in this operating procedure).",
          },
          usMiNotPastInitialClassificationReviewDate: {
            text: "Not past initial classification review date",
            tooltip:
              "Classification reviews shall be completed after six months of active supervision.  Unless an offender’s supervision level is mandated by policy or statute, the supervising Agent shall reduce an offender’s supervision level if the offender has satisfactorily completed six continuous months at the current assigned supervision level.",
          },
          usMiNotServingIneligibleOffensesForDowngradeFromSupervisionLevel: {
            text: "Not serving for an offense ineligible for a lower supervision level",
          },
        },
        firestoreCollection: "US_MI-supervisionLevelDowngrade",
        hideDenialRevert: false,
        homepagePosition: 5,
        ineligibleCriteriaCopy: {},
        initialHeader: null,
        isAlert: true,
        methodologyUrl:
          "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: [
          "ClientProfileDetails",
          "EligibilityDate",
          "CaseNotes",
        ],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
        stateCode: "US_MI",
        subheading:
          "This alert helps staff identify clients who are eligible for a downgrade in their supervision level during their first six months on supervision. The tool will surface clients who have not yet received a COMPAS but are being supervised at a level other than medium or whose supervision level is not aligned with their COMPAS score. Review clients within their first six months of supervision and whose supervision level does not match their risk level and downgrade their supervision level in COMS.",
        systemType: "SUPERVISION",
        tabGroups: null,
        tooltipEligibilityText: null,
        urlSection: "supervisionLevelMismatch",
      },
      usMiWardenInPersonSecurityClassificationCommitteeReview: {
        callToAction:
          "Complete SCC review and fill out 283 Form for eligible residents, inclusive of Warden signature.",
        compareBy: null,
        denialReasons: {
          ATTITUDE:
            "Behavior and attitude not consistent with general population expectations",
          "GP NOT APPROPRIATE":
            "Unable to honor trust implicit in less restrictive environment ",
          MISCONDUCTS: "Misconduct(s) filed during segregation",
          Other: "Other, please specify a reason",
          "PLACING BEHAVIOR":
            "Severe placing behavior necessitates longer stay in segregation",
          "PRIOR RH":
            "Prior restrictive housing history requires management at more restrictive level",
          RESPECT: "Fails to be cordial and respectful to staff",
        },
        denialText: null,
        displayName: "Warden In-Person Review",
        dynamicEligibilityText:
          "resident[|s] [is|are] eligible for in-person review by the Warden at SCC to potentially return to general population",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          usMiInSolitaryConfinementAtLeastSixMonths: {
            text: "Currently in {{usMiSegregationDisplayName record.formInformation.segregationType}}",
            tooltip:
              '{{#if (eq record.formInformation.segregationType "ADMINISTRATIVE_SOLITARY_CONFINEMENT")}}Housing unit team members and SCC shall regularly review the behavioral adjustment of each prisoner classified to administrative segregation, including prisoners classified to administrative segregation who are serving a detention sanction for misconduct.{{else if (eq record.formInformation.segregationType "TEMPORARY_SOLITARY_CONFINEMENT")}}If the prisoner is held in temporary segregation for more than 30 calendar days, the facility shall afford the prisoner a review to determine whether there is a continuing need for separation.{{/if}}',
          },
          usMiPastWardenInPersonReviewForSccDate: {
            text: "{{record.metadata.daysInCollapsedSolitarySession}} consecutive days in restrictive housing;{{#if latestWardenInPersonSccReviewDate}} last Warden in-person review recorded on {{date latestWardenInPersonSccReviewDate}};{{/if}} Warden in-person review due on or before {{date nextSccDate}}",
            tooltip:
              "Wardens shall personally interview each prisoner in their respective facilities who has been confined in administrative segregation for six continuous months. If the prisoner continues in administrative segregation beyond the first six month period, the Warden shall interview the prisoner every six months thereafter until the prisoner is released from administrative segregation.",
          },
        },
        firestoreCollection:
          "US_MI-wardenInPersonSecurityClassificationCommitteeReview",
        hideDenialRevert: false,
        homepagePosition: 7,
        ineligibleCriteriaCopy: {
          usMiInSolitaryConfinementAtLeastSixMonths: {
            text: "In restrictive housing for {{daysToYearsMonthsPast record.metadata.daysInCollapsedSolitarySession}}",
          },
          usMiPastWardenInPersonReviewForSccDate: {
            text: "Next Warden in-person review due in the next two months, on or before {{date nextSccDate}}",
            tooltip:
              "Wardens shall personally interview each prisoner in their respective facilities who has been confined in administrative segregation for six continuous months. If the prisoner continues in administrative segregation beyond the first six month period, the Warden shall interview the prisoner every six months thereafter until the prisoner is released from administrative segregation.",
          },
        },
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1tdYaic6jvsdTZHZTeGzUVtHL7_SGfyk5/view",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: [
          "Incarceration",
          "UsMiRestrictiveHousing",
          "CaseNotes",
        ],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 30 },
        stateCode: "US_MI",
        subheading:
          "This alert helps staff identify residents in restrictive housing who have spent 6+ consecutive months in segregation and are therefore due for an in-person SCC review with the Warden. Complete SCC review and fill out pre-filled 283 Form for eligible residents, inclusive of Warden signature. Where possible, work to transfer residents who no longer need to be in temporary or administrative segregation back to general population.",
        systemType: "INCARCERATION",
        tabGroups: {
          "ELIGIBILITY STATUS": [
            "Overdue",
            "Due now",
            "Upcoming",
            "Marked Ineligible",
          ],
        },
        tooltipEligibilityText: null,
        urlSection: "wardenInPersonSecurityClassificationCommitteeReview",
      },
    },
  };