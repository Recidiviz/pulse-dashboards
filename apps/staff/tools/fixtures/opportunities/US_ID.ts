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
    LSU: {
      callToAction:
        "Review clients who may be eligible for LSU and complete a pre-filled transfer chrono.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "SCNC",
          text: "SCNC: Not compliant with all court-ordered conditions and special conditions",
        },
        {
          key: "FFR",
          text: "FFR: Failure to make payments toward fines, fees, and restitution despite ability to pay",
        },
        { key: "NCO", text: "NCO: Has active NCO, CPO, or restraining order" },
        { key: "ILOCK", text: "ILOCK: Has active interlock device" },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Limited Supervision Unit",
      dynamicEligibilityText:
        "client[|s] may be eligible for the Limited Supervision Unit",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      emptyTabCopy: [],
      firestoreCollection: "US_ID-LSUReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 3,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "http://forms.idoc.idaho.gov/WebLink/0/edoc/273717/Limited%20Supervision%20Unit.pdf",
      nonOmsCriteria: [
        {
          text: "Must be compliant with all court-ordered conditions and special conditions ",
        },
        {
          text: "Has not failed to make payment toward fines/fees/restitution",
        },
        {
          text: "Must have established a record of progress toward successful completion of Court-ordered obligations for local incarceration and community service",
        },
        {
          text: "If relevant based on client history and officer discretion, must have had a negative UA within the past 90 days",
          tooltip:
            "Negative UA within past 90 days, unless the client lacks a history of drug/alcohol abuse or has been supervised at low risk for more than one year ",
        },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [],
      omsCriteriaHeader: "Validated by data from Atlas",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ID",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "The Limited Supervision Unit, which offers web-based reporting to low-risk clients, is the lowest level of supervision available in Idaho. This alert surfaces people who may be eligible for LSU based on the criteria set forth in policy. Review clients who may be eligible, complete a pre-filled transfer chrono, and go through the transfer process in Atlas.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for transfer to LSU",
      urlSection: "LSU",
      zeroGrantsTooltip: null,
    },
    earnedDischarge: {
      callToAction:
        "Review clients who may be eligible for Earned Discharge and complete a pre-filled request form.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "SCNC", text: "Not compliant with special conditions" },
        {
          key: "FFR",
          text: "Failure to make payments towards fines, fees, and restitution despite ability to pay",
        },
        { key: "NCIC", text: "Did not pass NCIC check" },
        {
          key: "PCD",
          text: "Parole Commission permanently denied early discharge request",
        },
        { key: "CD", text: "Court permanently denied early discharge request" },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Earned Discharge",
      dynamicEligibilityText: "client[|s] may be eligible for earned discharge",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usIdLsirLevelLowModerateForXDays",
          text: '{{#if (eq "LOW" riskLevel)}}Currently low risk with no increase in risk level in past 90 days{{else}}Currently moderate risk with no increase in risk level in past 360 days{{/if}}',
          tooltip:
            "Assessed at low risk level on LSI-R with no risk increase in past 90 days or moderate risk level on LSI-R with no risk increase in past 360 days",
        },
        {
          key: "negativeDaWithin90Days",
          text: "Negative UA within past 90 days",
          tooltip:
            "Negative UA within past 90 days, unless the client lacks a history of drug/alcohol abuse or has been supervised at low risk for more than one year",
        },
        {
          key: "usIdIncomeVerifiedWithin3Months",
          text: "Verified compliant employment",
          tooltip:
            "Verified employment status, full-time student, or adequate lawful income from non-employment sources have been confirmed within past 3 months",
        },
        {
          key: "noFelonyWithin24Months",
          text: "No felony convictions in past 24 months",
          tooltip:
            "Has not committed a felony while on probation or parole in past 24 months",
        },
        {
          key: "noViolentMisdemeanorWithin12Months",
          text: "No violent misdemeanor convictions in past 12 months",
          tooltip:
            "Has not committed a violent misdemeanor or DUI misdemeanor while on probation or parole in past 12 months",
        },
        {
          key: "pastEarnedDischargeEligibleDate",
          text: "Served minimum sentence requirements: has served {{daysToYearsMonthsPast (daysPast opportunity.person.supervisionStartDate)}}",
          tooltip:
            "If on probation, served minimum sentence according to the court; if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent offense, served at least one-third of remaining sentence; if on parole for a life sentence, served at least five years on parole",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ID-earnedDischargeReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [
        {
          key: "pastEarnedDischargeEligibleDate",
          text: "Needs {{monthsOrDaysRemainingFromToday eligibleDate}} on supervision",
          tooltip:
            "If on probation, served minimum sentence according to the court; if on parole for a nonviolent crime, served at least one year; if on parole for a sex/violent offense, served at least one-third of remaining sentence; if on parole for a life sentence, served at least five years on parole",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "http://forms.idoc.idaho.gov/WebLink/0/edoc/282369/Termination%20of%20Probation%20or%20Parole%20Supervision.pdf",
      nonOmsCriteria: [
        {
          text: "Must be compliant with all court-ordered conditions and special conditions",
        },
        {
          text: "Has not failed to make payment toward fines/fees/restitution",
        },
        { text: "Has not failed NCIC check" },
        {
          text: "If relevant based on client history and officer discretion, must have had a negative UA within the past 90 days",
        },
      ],
      nonOmsCriteriaHeader: "Requirements to check",
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ID",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify people who may be eligible for earned discharge based on IDOC’s criteria for consideration. Review clients who meet the criteria, complete the pre-filled request form, and go through the early discharge process with the court.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for Earned Discharge",
      urlSection: "earnedDischarge",
      zeroGrantsTooltip: null,
    },
    pastFTRD: {
      callToAction:
        "Review clients who are nearing or past their full-term release date and email clerical to move them to history.",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "ABSCONDING", text: "Client is in absconder status" },
        { key: "VIOLATION", text: "Client is in violation status" },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Release from Supervision",
      dynamicEligibilityText:
        "client[|s] [is|are] nearing or past their full-term release date",
      eligibilityDateText: "Full-term release date",
      eligibleCriteriaCopy: [
        {
          key: "supervisionPastFullTermCompletionDate",
          text: "{{daysPast eligibleDate}} days past FTRD ({{date eligibleDate}})",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ID-pastFTRDReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [
        {
          key: "supervisionPastFullTermCompletionDate",
          text: "{{daysUntil eligibleDate}} days until FTRD ({{date eligibleDate}})",
        },
      ],
      initialHeader:
        "Search for officers above to review clients whose full-term release date is near or has passed.",
      isAlert: true,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "HIGH",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: {
        autoSnoozeParams: { params: { days: 30 }, type: "snoozeDays" },
      },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ID",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify people whose full-term release date has passed so that they can be moved to history in order to right-size caseloads. Review clients whose full-term release date has passed and discharge them in Atlas.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for discharge",
      urlSection: "pastFTRD",
      zeroGrantsTooltip: null,
    },
    usIdCRCResidentWorker: {
      callToAction:
        "Review residents who may be eligbile for transfer to a CRC and start their paperwork in ATLAS.",
      compareBy: [{ field: "releaseDate" }],
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "MEDICAL",
          text: "Was not approved by an IDOC medical provider",
        },
        {
          key: "PENDING",
          text: "There are pending felony charges or felony investigations in which the resident is a suspect",
        },
        {
          key: "BEHAVIOR",
          text: "Resident has had poor institutional behavior",
        },
        { key: "PROGRAM", text: "Missing required facility programming" },
        { key: "DENIED", text: "Was denied a transfer to a CRC" },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Resident worker at Community Reentry Centers",
      dynamicEligibilityText:
        "resident[|s] may be eligible to be a resident worker at a Community Reentry Center",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        { key: "custodyLevelIsMinimum", text: "Currently on Minimum custody" },
        {
          key: "notServingForSexualOffense",
          text: "Not serving for a sexual offense",
        },
        {
          key: "notServingForViolentOffense",
          text: "Not serving for a violent offense",
        },
        {
          key: "usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years",
          text: "No escape attempts in the last 10 years",
          tooltip:
            "No escape, eluding police, or absconsion offense(s) in the last 10 years",
        },
        {
          key: "usIdNotDetainersForXcrcAndCrc",
          text: "No active felony detainers or holds",
          tooltip: "Cannot have any felony detainers or holds",
        },
        {
          key: "usIdIncarcerationWithin7YearsOfFtcdOrTpd",
          text: "Tentative Parole Date (TPD) within seven (7) years OR Full Term Release Date (FTRD) within seven (7) years",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
        },
        {
          key: "usIdIncarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd",
          text: "Parole Eligibility Date (PED) within seven (7) years AND Parole Hearing Date (PHD) within seven (7) years AND Full Term Release Date (FTRD) within 20 years",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
        },
        {
          key: "usIdIncarcerationWithin3YearsOfTpdAndLifeSentence",
          text: "Life sentence AND Tentative Parole Date (TPD) within 3 years",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
        },
        {
          key: "incarcerationWithin7YearsOfFtcdOrTpd",
          text: "Tentative Parole Date (TPD) within seven (7) years OR Full Term Release Date (FTRD) within seven (7) years",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
        },
        {
          key: "incarcerationWithin7YearsOfPedAndPhdAnd20YearsOfFtcd",
          text: "Parole Eligibility Date (PED) within seven (7) years AND Parole Hearing Date (PHD) within seven (7) years AND Full Term Release Date (FTRD) within 20 years",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
        },
        {
          key: "incarcerationWithin3YearsOfTpdAndLifeSentence",
          text: "Life sentence AND Tentative Parole Date (TPD) within 3 years",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (7) years OR\n        Full Term Release Date (FTRD) within seven (7) years\n    2. Parole Eligibility Date (PED) within seven (7) years AND\n        Parole Hearing Date (PHD) within seven (7) years AND\n        Full Term Release Date (FTRD) within 20 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 3 years",
        },
        {
          key: "usIdNotServingARiderSentence",
          text: "Not serving for a rider sentence",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ID-CRCResidentWorkerReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 5,
      ineligibleCriteriaCopy: [
        {
          key: "notServingForViolentOffense",
          text: "Serving for a violent offense",
        },
        {
          key: "usIdNotDeniedForCrc",
          text: "Has a CRC Termer Denied case note",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "UsIdPastTwoYearsAlert",
        "UsIdParoleDates",
        "CaseNotes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ID",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify people who may be eligible for transfer to a resident worker bed at a Community Reentry Center (CRC). Review eligible residents and request a transfer in Atlas.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: ["Eligible Now", "Almost Eligible", "Marked Ineligible"],
        },
        {
          key: "GENDER",
          tabs: [
            "Cisgender Male",
            "Cisgender Female",
            "Non-Binary",
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Gender Unavailable",
            "Marked Ineligible",
          ],
        },
        {
          key: "GENDER - Transgender Only",
          tabs: [
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Marked Ineligible",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "CRCResidentWorker",
      zeroGrantsTooltip: null,
    },
    usIdCRCWorkRelease: {
      callToAction:
        "Review residents who may be eligible for work-release to a CRC and start their paperwork in ATLAS.",
      compareBy: [{ field: "releaseDate" }],
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "MEDICAL",
          text: "Was not approved by an IDOC medical provider",
        },
        {
          key: "PENDING",
          text: "There are pending felony charges or felony investigations in which the resident is a suspect",
        },
        {
          key: "BEHAVIOR",
          text: "Resident has had poor institutional behavior",
        },
        { key: "PROGRAM", text: "Missing required facility programming" },
        { key: "DENIED", text: "Was denied a transfer to a CRC" },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Work-release at Community Reentry Centers",
      dynamicEligibilityText:
        "resident[|s] may be eligible for work-release at a Community Reentry Center",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        { key: "custodyLevelIsMinimum", text: "Currently on Minimum custody" },
        {
          key: "notServingForSexualOffense",
          text: "Not serving for a sexual offense",
        },
        {
          key: "notServingForViolentOffense",
          text: "Not serving for a violent offense",
        },
        {
          key: "usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years",
          text: "No escape attempts in the last 10 years",
          tooltip:
            "No escape, eluding police, or absconsion offense(s) in the last 10 years",
        },
        {
          key: "usIdNotDetainersForXcrcAndCrc",
          text: "No active felony detainers or holds",
          tooltip: "Cannot have any felony detainers or holds",
        },
        {
          key: "usIdIncarcerationWithin18MonthsOfFtcdOrTpd",
          text: "Tentative Parole Date (TPD) within eighteen (18) months OR Full Term Release Date (FTRD) within eighteen (18) months",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
        },
        {
          key: "usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd",
          text: "Early Release Date (EPRD) within 18 months AND Full Term Release Date (FTRD) within 15 years",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
        },
        {
          key: "usIdIncarcerationWithin1YearOfTpdAndLifeSentence",
          text: "Life sentence AND Tentative Parole Date (TPD) within 1 year",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
        },
        {
          key: "incarcerationWithin18MonthsOfFtcdOrTpd",
          text: "Tentative Parole Date (TPD) within eighteen (18) months OR Full Term Release Date (FTRD) within eighteen (18) months",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within eighteen (18) months OR\n        Full Term Release Date (FTRD) within eighteen (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
        },
        {
          key: "incarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd",
          text: "Early Release Date (EPRD) within 18 months AND Full Term Release Date (FTRD) within 15 years",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within eighteen (18) months OR\n        Full Term Release Date (FTRD) within eighteen (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
        },
        {
          key: "incarcerationWithin1YearOfTpdAndLifeSentence",
          text: "Life sentence AND Tentative Parole Date (TPD) within 1 year",
          tooltip:
            "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within eighteen (18) months OR\n        Full Term Release Date (FTRD) within eighteen (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
        },
        {
          key: "usIdNotServingARiderSentence",
          text: "Not serving for a rider sentence",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ID-CRCWorkReleaseReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 6,
      ineligibleCriteriaCopy: [
        {
          key: "notServingForViolentOffense",
          text: "Serving for a violent offense",
        },
        {
          key: "usIdNotDeniedForCrc",
          text: "Has a CRC Termer Denied case note",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "UsIdPastTwoYearsAlert",
        "UsIdParoleDates",
        "CaseNotes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ID",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify people who may be eligible for transfer to a work-release bed at a Community Reentry Center (CRC). Review eligible residents and request a transfer in Atlas.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: ["Eligible Now", "Almost Eligible", "Marked Ineligible"],
        },
        {
          key: "GENDER",
          tabs: [
            "Cisgender Male",
            "Cisgender Female",
            "Non-Binary",
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Gender Unavailable",
            "Marked Ineligible",
          ],
        },
        {
          key: "GENDER - Transgender Only",
          tabs: [
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Marked Ineligible",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "CRCWorkRelease",
      zeroGrantsTooltip: null,
    },
    usIdCustodyLevelDowngrade: {
      callToAction: "Review eligible residents and reclassify in Atlas.",
      compareBy: [
        { field: "eligibilityDate", sortDirection: "asc" },
        { field: "releaseDate", sortDirection: "asc" },
      ],
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        { key: "OVERRIDE", text: "Active discretionary override" },
        {
          key: "PROGRAMMING",
          text: "Reclassification would disrupt required programming",
        },
        {
          key: "HOUSING",
          text: "Reclassification requires housing that is currently unavailable",
        },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Unscheduled Reclassification",
      dynamicEligibilityText:
        "resident[|s] may be eligible for an unscheduled reclassification to a lower custody level",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "custodyLevelHigherThanRecommended",
          text: "Custody level has been higher than latest classification score suggests since {{date upcomingEligibilityDate}}.",
          tooltip: "",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ID-custodyLevelDowngradeReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [
        {
          key: "custodyLevelHigherThanRecommended",
          text: "Custody level will be higher than classification score on  {{date upcomingEligibilityDate}}.",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["Incarceration"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ID",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "\nThis alert helps staff identify people who may be eligible for an unscheduled reclassification to a lower custody level. ",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "custodyLevelDowngrade",
      zeroGrantsTooltip: null,
    },
    usIdExpandedCRC: {
      callToAction:
        "Review clients who may be eligible for a transfer to XCRC and start their paperwork in ATLAS.",
      compareBy: [{ field: "releaseDate" }],
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "BEHAVIOR",
          text: "Resident has had poor institutional behavior",
        },
        {
          key: "CLASS_A_OR_B",
          text: "Has class A or B disciplinary reports in the past six months",
        },
        {
          key: "EMPLOYMENT",
          text: "Resident is not currently employed full-time or engaged in or accepted to a full-time Idaho educational program approved by the IDOC",
        },
        {
          key: "MEDICAL",
          text: "Was not approved by an IDOC medical provider",
        },
        { key: "Other", text: "Other, please specify a reason" },
        { key: "PROGRAM", text: "Missing required facility programming" },
        {
          key: "TRUST",
          text: "Resident does not have $500.00 in their resident trust account",
        },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Expanded Community Reentry Centers",
      dynamicEligibilityText:
        "resident[|s] [is|are] eligible for transfer to Expanded Community Reentry Centers.",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "custodyLevelIsMinimum",
          text: "Currently on Minimum custody",
          tooltip:
            "Shall be institutionally classified as minimum custody and cannot receive a classification override",
        },
        {
          key: "notServingForSexualOffense",
          text: "Not serving for a sexual offense",
        },
        {
          key: "notServingForViolentOffense",
          text: "Not serving for a violent offense",
        },
        {
          key: "usIdInCrcFacilityOrPwccUnit1",
          text: "Resident in {{{facilityName}}} since {{date crcStartDate}}",
        },
        {
          key: "usIdInCrcFacilityOrPwccUnit1For60Days",
          text: "Served at least 60 days at current facility",
          tooltip:
            "Shall have resided in a CRC or minimum custody employment release program (such as PWCC’s Unit 1) for a minimum of 60 days",
        },
        {
          key: "incarcerationWithin6MonthsOfFtcdOrPedOrTpd",
          text: "Is within 6 months of release",
          tooltip:
            "Shall be within six months of release (generally calculated from the parole eligibility date, full-term release, or tentative parole date). Those who are past their parole eligibility date or within six months of a tentative parole date may also be considered, on a case by case basis",
        },
        {
          key: "usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years",
          text: "No escape attempts in the last 10 years",
          tooltip:
            "No escape, eluding police, or absconsion offense(s) in the last 10 years",
        },
        {
          key: "usIdNotDetainersForXcrcAndCrc",
          text: "No active felony detainers or holds",
          tooltip: "Cannot have any felony detainers or holds",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ID-expandedCRCReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 4,
      ineligibleCriteriaCopy: [
        {
          key: "notServingForViolentOffense",
          text: "Serving for a violent offense",
        },
        {
          key: "usIdInCrcFacilityOrPwccUnit1For60Days",
          text: "In a CRC facility but has not been there for 60 days",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "UsIdPastTwoYearsAlert",
        "UsIdParoleDates",
        "CaseNotes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 30 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ID",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify people who meet the criteria to participate in the expanded CRC program, which allows eligible CRC residents to spend the last six months of their sentence living and working in the community. Review eligible residents and work with P&P to complete a transfer to expanded CRC if program capacity allows.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "INCARCERATION",
      tabGroups: [
        {
          key: "ELIGIBILITY STATUS",
          tabs: ["Eligible Now", "Almost Eligible", "Marked Ineligible"],
        },
        {
          key: "GENDER",
          tabs: [
            "Cisgender Male",
            "Cisgender Female",
            "Non-Binary",
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Gender Unavailable",
            "Marked Ineligible",
          ],
        },
        {
          key: "GENDER - Transgender Only",
          tabs: [
            "Transgender Male",
            "Transgender Female",
            "Transgender - Unavailable",
            "Marked Ineligible",
          ],
        },
      ],
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "expandedCRC",
      zeroGrantsTooltip: null,
    },
    usIdSupervisionLevelDowngrade: {
      callToAction: "Change their supervision level in Atlas",
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "INCORRECT",
          text: "INCORRECT: Risk score listed here is incorrect",
        },
        {
          key: "OVERRIDE",
          text: "OVERRIDE: Client is being overridden to a different supervision level",
        },
        { key: "Other", text: "Other: please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Supervision Level Mismatch",
      dynamicEligibilityText:
        "client[|s] [is|are] being supervised at a level that does not match their latest risk score",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "supervisionLevelHigherThanAssessmentLevel",
          text: "Current supervision level: {{supervisionLevel}}; {{#if assessmentLevel}}Last risk score: {{assessmentLevel}} {{#if latestAssessmentDate}}(as of {{date latestAssessmentDate}}){{else}}(assessment date unknown){{/if}}{{else}}Has not yet been assessed{{/if}}",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_ID-supervisionLevelDowngrade",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 7,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: true,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=share_link",
      nonOmsCriteria: [],
      nonOmsCriteriaHeader: null,
      notifications: [],
      omsCriteriaHeader: null,
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_ID",
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "This alert helps staff identify people whose current supervision level does not match their latest LSI-R or STATIC risk score; it does not surface people who are on specialized supervision levels by policy. Review eligible clients and update their supervision level in Atlas.",
      submittedTabTitle: null,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: "Eligible for supervision downgrade",
      urlSection: "supervisionLevelMismatch",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
