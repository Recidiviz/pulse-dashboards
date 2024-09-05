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
      LSU: {
        callToAction:
          "Review clients who may be eligible for LSU and complete a pre-filled transfer chrono.",
        compareBy: null,
        denialReasons: {
          FFR: "FFR: Failure to make payments toward fines, fees, and restitution despite ability to pay",
          INTERLOCK: "INTERLOCK: Has an active interlock device",
          MIS: "Has had a violent misdemeanor conviction in the past 12 months",
          "NCO/CPO": "NCO/CPO: Has an active NCO, CPO, or restraining order",
          Other: "Other, please specify a reason",
          SCNC: "SCNC: Not compliant with all court-ordered conditions and special conditions",
        },
        denialText: null,
        displayName: "Limited Supervision Unit",
        dynamicEligibilityText:
          "client[|s] may be eligible for the Limited Supervision Unit",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {},
        firestoreCollection: "US_ID-LSUReferrals",
        hideDenialRevert: false,
        homepagePosition: 3,
        ineligibleCriteriaCopy: {},
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "http://forms.idoc.idaho.gov/WebLink/0/edoc/273717/Limited%20Supervision%20Unit.pdf",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
        stateCode: "US_ID",
        subheading:
          "The Limited Supervision Unit, which offers web-based reporting to low-risk clients, is the lowest level of supervision available in Idaho. This alert surfaces people who may be eligible for LSU based on the criteria set forth in policy. Review clients who may be eligible, complete a pre-filled transfer chrono, and go through the transfer process in Atlas.",
        systemType: "SUPERVISION",
        tabGroups: null,
        tooltipEligibilityText: "Eligible for transfer to LSU",
        urlSection: "LSU",
      },
      earnedDischarge: {
        callToAction:
          "Review clients who may be eligible for Earned Discharge and complete a pre-filled request form.",
        compareBy: null,
        denialReasons: {
          CD: "Court permanently denied early discharge request",
          FFR: "Failure to make payments towards fines, fees, and restitution despite ability to pay",
          INTERLOCK: "Has an active interlock device",
          MIS: "Has had a violent misdemeanor conviction in the past 12 months",
          NCIC: "Did not pass NCIC check",
          Other: "Other, please specify a reason",
          PCD: "Parole Commission permanently denied early discharge request",
          SCNC: "Not compliant with special conditions",
        },
        denialText: null,
        displayName: "Earned Discharge",
        dynamicEligibilityText:
          "client[|s] may be eligible for earned discharge",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          negativeDaWithin90Days: {
            text: "Negative UA within past 90 days",
            tooltip:
              "Negative UA within past 90 days, unless the client lacks a history of drug/alcohol abuse or has been supervised at low risk for more than one year",
          },
          noFelonyWithin24Months: {
            text: "No felony convictions in past 24 months",
            tooltip:
              "Has not committed a felony while on probation or parole in past 24 months",
          },
          noViolentMisdemeanorWithin12Months: {
            text: "No violent misdemeanor convictions in past 12 months",
            tooltip:
              "Has not committed a violent misdemeanor or DUI misdemeanor while on probation or parole in past 12 months",
          },
          pastEarnedDischargeEligibleDate: {
            text: "Served {{daysToYearsMonthsPast (daysPast opportunity.person.supervisionStartDate)}}",
            tooltip:
              "If on probation, served minimum sentence according to the court; if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent offense, served at least one-third of remaining sentence; if on parole for a life sentence, served at least five years on parole",
          },
          usIdIncomeVerifiedWithin3Months: {
            text: "Verified compliant employment",
            tooltip:
              "Verified employment status, full-time student, or adequate lawful income from non-employment sources have been confirmed within past 3 months",
          },
          usIdLsirLevelLowModerateForXDays: {
            text: '{{#if (eq "LOW" riskLevel)}}Currently low risk with no increase in risk level in past 90 days{{else}}Currently moderate risk with no increase in risk level in past 360 days{{/if}}',
            tooltip:
              "Assessed at low risk level on LSI-R with no risk increase in past 90 days or moderate risk level on LSI-R with no risk increase in past 360 days",
          },
        },
        firestoreCollection: "US_ID-earnedDischargeReferrals",
        hideDenialRevert: false,
        homepagePosition: 2,
        ineligibleCriteriaCopy: {
          pastEarnedDischargeEligibleDate: {
            text: "Needs {{monthsOrDaysRemainingFromToday eligibleDate}} on supervision",
            tooltip:
              "If on probation, served minimum sentence according to the court; if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent offense, served at least one-third of remaining sentence; if on parole for a life sentence, served at least five years on parole",
          },
        },
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "http://forms.idoc.idaho.gov/WebLink/0/edoc/282369/Termination%20of%20Probation%20or%20Parole%20Supervision.pdf",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
        stateCode: "US_ID",
        subheading:
          "This alert helps staff identify people who may be eligible for earned discharge based on IDOC’s criteria for consideration. Review clients who meet the criteria, complete the pre-filled request form, and go through the early discharge process with the court.",
        systemType: "SUPERVISION",
        tabGroups: null,
        tooltipEligibilityText: "Eligible for Earned Discharge",
        urlSection: "earnedDischarge",
      },
      pastFTRD: {
        callToAction:
          "Review clients who are nearing or past their full-term release date and email clerical to move them to history.",
        compareBy: null,
        denialReasons: {
          ABSCONDING: "Client is in absconder status",
          Other: "Other: please specify a reason",
          VIOLATION: "Client is in violation status",
        },
        denialText: null,
        displayName: "Release from Supervision",
        dynamicEligibilityText:
          "client[|s] [is|are] nearing or past their full-term release date",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          supervisionPastFullTermCompletionDate: {
            text: "{{daysPast eligibleDate}} days past FTRD ({{date eligibleDate}})",
          },
        },
        firestoreCollection: "US_ID-pastFTRDReferrals",
        hideDenialRevert: false,
        homepagePosition: 1,
        ineligibleCriteriaCopy: {
          supervisionPastFullTermCompletionDate: {
            text: "{{daysUntil eligibleDate}} days until FTRD ({{date eligibleDate}})",
          },
        },
        initialHeader:
          "Search for officers above to review clients whose full-term release date is near or has passed.",
        isAlert: true,
        methodologyUrl:
          "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
        notifications: [],
        priority: "HIGH",
        sidebarComponents: ["ClientProfileDetails"],
        snooze: {
          autoSnoozeParams: { params: { days: 30 }, type: "snoozeDays" },
        },
        stateCode: "US_ID",
        subheading:
          "This alert helps staff identify people whose full-term release date has passed so that they can be moved to history in order to right-size caseloads. Review clients whose full-term release date has passed and discharge them in Atlas.",
        systemType: "SUPERVISION",
        tabGroups: null,
        tooltipEligibilityText: "Eligible for discharge",
        urlSection: "pastFTRD",
      },
      usIdCRCResidentWorker: {
        callToAction:
          "Review residents who may be eligbile for transfer to a CRC and start their paperwork in ATLAS.",
        compareBy: [{ field: "releaseDate" }],
        denialReasons: {
          BEHAVIOR: "Resident has had poor institutional behavior",
          DENIED: "Was denied a transfer to a CRC",
          IN_PROGRESS: "Was approved and is waiting to be transferred to a CRC",
          MEDICAL: "Was not approved by an IDOC medical provider",
          Other: "Other, please specify a reason",
          PENDING:
            "There are pending felony charges or felony investigations in which the resident is a suspect",
          PROGRAM: "Missing required facility programming",
        },
        denialText: null,
        displayName: "Resident worker at Community Reentry Centers",
        dynamicEligibilityText:
          "resident[|s] may be eligible to be a resident worker at a Community Reentry Center",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          custodyLevelIsMinimum: { text: "Currently on Minimum custody" },
          notServingForSexualOffense: {
            text: "Not serving for a sexual offense",
          },
          notServingForViolentOffense: {
            text: "Not serving for a violent offense",
          },
          usIdIncarcerationWithin3YearsOfTpdAndLifeSentence: {
            text: "Life sentence AND Tentative Parole Date (TPD) within 3 years",
            tooltip:
              "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
          },
          usIdIncarcerationWithin7YearsOfFtcdOrTpd: {
            text: "Tentative Parole Date (TPD) within seven (7) years OR Full Term Release Date (FTRD) within seven (7) years",
            tooltip:
              "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
          },
          usIdIncarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd: {
            text: "Parole Eligibility Date (PED) within seven (7) years AND Parole Hearing Date (PHD) within seven (7) years AND Full Term Release Date (FTRD) within 20 years",
            tooltip:
              "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
          },
          usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: {
            text: "No escape attempts in the last 10 years",
            tooltip:
              "No escape, eluding police, or absconsion offense(s) in the last 10 years",
          },
          usIdNoDetainersForXcrcAndCrc: {
            text: "No active felony detainers or holds",
            tooltip: "Cannot have any felony detainers or holds",
          },
        },
        firestoreCollection: "US_ID-CRCResidentWorkerReferrals",
        hideDenialRevert: false,
        homepagePosition: 5,
        ineligibleCriteriaCopy: {
          notServingForViolentOffense: {
            text: "Serving for a violent offense and eligible for CRC placement with an override",
          },
        },
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: [
          "Incarceration",
          "UsIdPastTwoYearsAlert",
          "UsIdParoleDates",
          "CaseNotes",
        ],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
        stateCode: "US_ID",
        subheading:
          "This alert helps staff identify people who may be eligible for transfer to a resident worker bed at a Community Reentry Center (CRC). Review eligible residents and request a transfer in Atlas.",
        systemType: "INCARCERATION",
        tabGroups: {
          "ELIGIBILITY STATUS": [
            "Eligible Now",
            "Almost Eligible",
            "Marked Ineligible",
          ],
          GENDER: [
            "Cisgender Male",
            "Cisgender Female",
            "Non-Binary",
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Gender Unavailable",
            "Marked Ineligible",
          ],
          "GENDER - Transgender Only": [
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Marked Ineligible",
          ],
        },
        tooltipEligibilityText: null,
        urlSection: "CRCResidentWorker",
      },
      usIdCRCWorkRelease: {
        callToAction:
          "Review residents who may be eligible for work-release to a CRC and start their paperwork in ATLAS.",
        compareBy: [{ field: "releaseDate" }],
        denialReasons: {
          BEHAVIOR: "Resident has had poor institutional behavior",
          DENIED: "Was denied a transfer to a CRC",
          IN_PROGRESS: "Was approved and is waiting to be transferred to a CRC",
          MEDICAL: "Was not approved by an IDOC medical provider",
          Other: "Other, please specify a reason",
          PENDING:
            "There are pending felony charges or felony investigations in which the resident is a suspect",
          PROGRAM: "Missing required facility programming",
        },
        denialText: null,
        displayName: "Work-release at Community Reentry Centers",
        dynamicEligibilityText:
          "resident[|s] may be eligible for work-release at a Community Reentry Center",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          custodyLevelIsMinimum: { text: "Currently on Minimum custody" },
          notServingForSexualOffense: {
            text: "Not serving for a sexual offense",
          },
          notServingForViolentOffense: {
            text: "Not serving for a violent offense",
          },
          usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd: {
            text: "Early Release Date (EPRD) within 18 months AND Full Term Release Date (FTRD) within 15 years",
            tooltip:
              "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
          },
          usIdIncarcerationWithin18MonthsOfFtcdOrTpd: {
            text: "Tentative Parole Date (TPD) within eighteen (18) months OR Full Term Release Date (FTRD) within eighteen (18) months",
            tooltip:
              "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
          },
          usIdIncarcerationWithin1YearOfTpdAndLifeSentence: {
            text: "Life sentence AND Tentative Parole Date (TPD) within 1 year",
            tooltip:
              "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
          },
          usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: {
            text: "No escape attempts in the last 10 years",
            tooltip:
              "No escape, eluding police, or absconsion offense(s) in the last 10 years",
          },
          usIdNoDetainersForXcrcAndCrc: {
            text: "No active felony detainers or holds",
            tooltip: "Cannot have any felony detainers or holds",
          },
        },
        firestoreCollection: "US_ID-CRCWorkReleaseReferrals",
        hideDenialRevert: false,
        homepagePosition: 6,
        ineligibleCriteriaCopy: {
          notServingForViolentOffense: {
            text: "Serving for a violent offense and eligible for CRC placement with an override",
          },
        },
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: [
          "Incarceration",
          "UsIdPastTwoYearsAlert",
          "UsIdParoleDates",
          "CaseNotes",
        ],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
        stateCode: "US_ID",
        subheading:
          "This alert helps staff identify people who may be eligible for transfer to a work-release bed at a Community Reentry Center (CRC). Review eligible residents and request a transfer in Atlas.",
        systemType: "INCARCERATION",
        tabGroups: {
          "ELIGIBILITY STATUS": [
            "Eligible Now",
            "Almost Eligible",
            "Marked Ineligible",
          ],
          GENDER: [
            "Cisgender Male",
            "Cisgender Female",
            "Non-Binary",
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Gender Unavailable",
            "Marked Ineligible",
          ],
          "GENDER - Transgender Only": [
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Marked Ineligible",
          ],
        },
        tooltipEligibilityText: null,
        urlSection: "CRCWorkRelease",
      },
      usIdExpandedCRC: {
        callToAction:
          "Review clients who may be eligible for a transfer to XCRC and start their paperwork in ATLAS.",
        compareBy: [{ field: "releaseDate" }],
        denialReasons: {
          BEHAVIOR: "Resident has had poor institutional behavior",
          CLASS_A_OR_B:
            "Has class A or B disciplinary reports in the past six months",
          EMPLOYMENT:
            "Resident is not currently employed full-time or engaged in or accepted to a full-time Idaho educational program approved by the IDOC",
          MEDICAL: "Was not approved by an IDOC medical provider",
          Other: "Other, please specify a reason",
          PENDING:
            "There are pending felony charges or felony investigations in which the resident is a suspect",
          PROGRAM: "Missing required facility programming",
          TRUST:
            "Resident does not have $500.00 in their resident trust account",
        },
        denialText: null,
        displayName: "Expanded Community Reentry Centers",
        dynamicEligibilityText:
          "resident[|s] [is|are] eligible for transfer to Expanded Community Reentry Centers.",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          custodyLevelIsMinimum: {
            text: "Currently on Minimum custody",
            tooltip:
              "Shall be institutionally classified as minimum custody and cannot receive a classification override",
          },
          notServingForSexualOffense: {
            text: "Not serving for a sexual offense",
          },
          notServingForViolentOffense: {
            text: "Not serving for a violent offense",
          },
          usIdInCrcFacilityOrPwccUnit1: {
            text: "Resident in {{facilityName}} since {{date crcStartDate}}",
          },
          usIdInCrcFacilityOrPwccUnit1For60Days: {
            text: "Served at least 60 days at current facility",
            tooltip:
              "Shall have resided in a CRC or minimum custody employment release program (such as PWCC’s Unit 1) for a minimum of 60 days",
          },
          usIdIncarcerationWithin6MonthsOfFtcdOrPedOrTpd: {
            text: "Is within 6 months of release",
            tooltip:
              "Shall be within six months of release (generally calculated from the parole eligibility date, full-term release, or tentative parole date). Those who are past their parole eligibility date or within six months of a tentative parole date may also be considered, on a case by case basis",
          },
          usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: {
            text: "No escape attempts in the last 10 years",
            tooltip:
              "No escape, eluding police, or absconsion offense(s) in the last 10 years",
          },
          usIdNoDetainersForXcrcAndCrc: {
            text: "No active felony detainers or holds",
            tooltip: "Cannot have any felony detainers or holds",
          },
        },
        firestoreCollection: "US_ID-expandedCRCReferrals",
        hideDenialRevert: false,
        homepagePosition: 4,
        ineligibleCriteriaCopy: {
          notServingForViolentOffense: {
            text: "Serving for a violent offense and eligible for CRC placement with an override",
          },
          usIdInCrcFacilityOrPwccUnit1For60Days: {
            text: "In a CRC facility but has not been there for 60 days",
          },
        },
        initialHeader: null,
        isAlert: false,
        methodologyUrl:
          "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: [
          "Incarceration",
          "UsIdPastTwoYearsAlert",
          "UsIdParoleDates",
          "CaseNotes",
        ],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 30 },
        stateCode: "US_ID",
        subheading:
          "This alert helps staff identify people who meet the criteria to participate in the expanded CRC program, which allows eligible CRC residents to spend the last six months of their sentence living and working in the community. Review eligible residents and work with P&P to complete a transfer to expanded CRC if program capacity allows.",
        systemType: "INCARCERATION",
        tabGroups: {
          "ELIGIBILITY STATUS": [
            "Eligible Now",
            "Almost Eligible",
            "Marked Ineligible",
          ],
          GENDER: [
            "Cisgender Male",
            "Cisgender Female",
            "Non-Binary",
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Gender Unavailable",
            "Marked Ineligible",
          ],
          "GENDER - Transgender Only": [
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Marked Ineligible",
          ],
        },
        tooltipEligibilityText: null,
        urlSection: "expandedCRC",
      },
      usIdSupervisionLevelDowngrade: {
        callToAction: "Change their supervision level in Atlas",
        compareBy: null,
        denialReasons: {
          INCORRECT: "INCORRECT: Risk score listed here is incorrect",
          OVERRIDE:
            "OVERRIDE: Client is being overridden to a different supervision level",
          Other: "Other: please specify a reason",
        },
        denialText: null,
        displayName: "Supervision Level Mismatch",
        dynamicEligibilityText:
          "client[|s] [is|are] being supervised at a level that does not match their latest risk score",
        eligibilityDateText: null,
        eligibleCriteriaCopy: {
          supervisionLevelHigherThanAssessmentLevel: {
            text: "Current supervision level: {{supervisionLevel}}; Last risk score: {{assessmentLevel}} {{#if latestAssessmentDate}}(as of {{date latestAssessmentDate}}){{else}}(assessment date unknown){{/if}}",
          },
        },
        firestoreCollection: "US_ID-supervisionLevelDowngrade",
        hideDenialRevert: false,
        homepagePosition: 7,
        ineligibleCriteriaCopy: {},
        initialHeader: null,
        isAlert: true,
        methodologyUrl:
          "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=share_link",
        notifications: [],
        priority: "NORMAL",
        sidebarComponents: ["ClientProfileDetails"],
        snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
        stateCode: "US_ID",
        subheading:
          "This alert helps staff identify people whose current supervision level does not match their latest LSI-R or STATIC risk score; it does not surface people who are on specialized supervision levels by policy. Review eligible clients and update their supervision level in Atlas.",
        systemType: "SUPERVISION",
        tabGroups: null,
        tooltipEligibilityText: "Eligible for supervision downgrade",
        urlSection: "supervisionLevelMismatch",
      },
    },
  };
