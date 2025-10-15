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
    usPaAdminSupervision: {
      callToAction: "Review clients and complete the DC-P 402 forms",
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "FINES & FEES",
          text: "Client is not making efforts to reduce financial obligations",
        },
        {
          key: "SPECIAL CONDITIONS",
          text: "Client has not fulfilled special conditions or treatment requirements",
        },
        {
          key: "PFA",
          text: "Client is named in a PFA order or has a history of PFAs",
        },
        {
          key: "SEX",
          text: "Client is an SVP or is supervised under the sex offender protocol",
        },
        {
          key: "UNREPORTED",
          text: "Client has an out of state charge or an unreported disposition on an offense that makes them ineligible per form 402",
        },
        {
          key: "DRUG",
          text: "Client has a drug offense that makes them ineligible per form 402a",
        },
        {
          key: "VIOLENT",
          text: "Client was convicted of a crime of violence as defined by 42 Pa.C.S. § 9714(g)",
        },
        {
          key: "DUI",
          text: " Client was charged with 75 PA C.S. 3731 relating to DUI/Controlled Substance and their case involved bodily injury",
        },
        {
          key: "OBSC",
          text: "Client was charged with 18 PA. C.S. 5903(4)(5)(6) relating to obscene/sexual material/performance and the victim was a minor",
        },
        {
          key: "FIREARM",
          text: "Client has a sentencing enhancement of 42 Pa. C.S. 9712 (related to firearms) or 204 PA Code 303.10(a) (related to deadly weapons)",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Administrative Supervision",
      dynamicEligibilityText:
        "client[|s] may be eligible for transfer to Administrative Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usPaOnSupervisionAtLeastOneYear",
          text: "Has served on supervision for at least one year",
          tooltip:
            "This is determined by whether a year has passed since the reentrant’s release date",
        },
        {
          key: "usPaNoHighSanctionsInPastYear",
          text: "Has not incurred high sanctions within the last year",
          tooltip:
            "Per policy, the tool checks the severity of the sanction, not the severity of the violation itself.",
        },
        {
          key: "usPaNotServingIneligibleOffenseForAdminSupervision",
          text: "Not convicted of an ineligible offense",
          tooltip:
            'Click "complete 402 forms" to see full list of ineligible offenses',
        },
        {
          key: "usPaNotOnSexOffenseProtocol",
          text: "Not designated as a sex offender",
          tooltip:
            "A reentrant is considered a sex offender if they have a problem area of “Sex Offender” checked in Captor or have any special conditions or treatments that relate to sex offenders and/or Megan’s Law",
        },
        {
          key: "supervisionLevelIsNotHighOrMaxForOneYear",
          text: "Not supervised under enhanced or maximum supervision within the past 12 months",
          tooltip: "",
        },
        {
          key: "usPaNotMarkedIneligibleForAdminSupervisionInOms",
          text: "Not marked NAE",
          tooltip:
            'This is determined by whether "NAE" ("Not Admin Eligible") is found in the Other, Miscellaneous, or Notes fields in Captor',
        },
        {
          key: "notSupervisionPastFullTermCompletionDateOrUpcoming90Days",
          text: "Not within 90 days of max date",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_PA-adminSupervisionReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [
        {
          key: "usPaOnSupervisionAtLeastOneYear",
          text: "Needs {{monthsOrDaysRemainingFromToday eligibleDate}} on supervision",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://docs.google.com/document/d/e/2PACX-1vSdsgMDOmD7tR_IP8NwqYggO6w9MBsAdB3jZp8ZEfWSseoGw0_6gBuF1hw6AGUskESpnA7htA8uct_y/pub",
      nonOmsCriteria: [
        {
          text: "Has fulfilled treatment and special condition requirements",
          tooltip:
            "See below for list of treatments and relevant special conditions",
        },
        {
          text: "Making efforts to reduce financial obligations\t",
          tooltip:
            "See intranet (Act 35 - Supervision Financial Obligations section) or UJS site for financial obligations",
        },
        {
          text: "Does not have a history of PFAs or a current PFA order ",
          tooltip:
            "See domestic violence section of integrated case summary for PFA orders",
        },
        {
          text: "Does not have out of state charges for ineligible offenses",
          tooltip:
            'Click "complete 402 forms" to see full list of ineligible offenses',
        },
        {
          text: "Does not have sentencing enhancements related to firearms or deadly weapons",
          tooltip:
            "Ineligible sentencing enhancements include 42 Pa. C.S. 9712 (related to firearms), and 204 PA Code 303.10(a) (related to deadly weapons)",
        },
      ],
      nonOmsCriteriaHeader: "Requirements for agents to check",
      notifications: [],
      omsCriteriaHeader: "Requirements fulfilled",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_PA",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Administrative supervision is a level of supervision that requires less contact than the minimum supervision level. It requires at least one face-to-face contact and one collateral contact per year. On this page, you can review clients and complete the DC-P 402 form. For more information, please refer to the supervision levels policy [here](https://drive.google.com/file/d/1MeqGQPvWNytOhUJCYsevoXwtTOEK0TIh/view) or learn more about [our methodology](https://docs.google.com/document/d/e/2PACX-1vSdsgMDOmD7tR_IP8NwqYggO6w9MBsAdB3jZp8ZEfWSseoGw0_6gBuF1hw6AGUskESpnA7htA8uct_y/pub).",
      submittedTabTitle: "Pending Review",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "adminSupervision",
      zeroGrantsTooltip:
        "This agent has not granted any clients this opportunity in the past 12 months.",
    },
    usPaSpecialCircumstancesSupervision: {
      callToAction:
        "Review clients and transfer to administrative supervision caseload",
      caseNotesTitle: null,
      compareBy: null,
      denialAdjective: null,
      denialNoun: null,
      denialReasons: [
        {
          key: "FINES & FEES",
          text: "Client is not making efforts to reduce financial obligations",
        },
        {
          key: "SATISFACTORY",
          text: "Client has not had a satisfactory adjustment over their term of supervision",
        },
        {
          key: "SPECIAL CONDITIONS",
          text: "Client has not fulfilled special conditions or treatment requirements",
        },
        {
          key: "SEX",
          text: "Client is an SVP or is supervised under the sex offender protocol",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      deniedTabTitle: null,
      displayName: "Special Circumstances Supervision",
      dynamicEligibilityText:
        "client[|s] may be eligible for transfer to Special Circumstances Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usPaMeetsSpecialCircumstancesCriteriaForTimeServed",
          text: "Currently serving a {{caseType}} and has served on supervision for {{yearsRequiredToServe}} {{#if (eq yearsRequiredToServe 1)}}year{{else}}years{{/if}}",
          tooltip:
            'Per policy 12.4.01.06, {{#if (eq caseType "non-life sentence (violent case)")}}"a non-life sentenced reentrant (violent case) with a satisfactory adjustment\nover a five-year period" is eligible for SPC. This reentrant was classified as a violent case because they are currently serving for an offense listed in 42 Pa.C.S. § 9714(g).{{/if}}{{#if (eq caseType "non-life sentence (non-violent case)")}}"a non-life sentenced reentrant (non-violent case) with a satisfactory\nadjustment over a three-year period" is eligible for SPC. This reentrant was classified as a non-violent case because they are not currently serving for an offense listed in 42 Pa.C.S. § 9714(g).{{/if}}{{#if (eq caseType "life sentence")}}"a reentrant serving a life sentence with a satisfactory adjustment over a seven-\nyear period" is eligible for SPC.{{/if}}{{#if (eq caseType "special probation or parole case")}}"special probation and special parole cases that have...one year or more of successful supervision" are eligible for SPC.{{/if}} Time on supervision is determined by the amount of time that has passed since the reentrant\'s release date.',
        },
        {
          key: "usPaMeetsSpecialCircumstancesCriteriaForSanctions",
          text: "No {{sanctionType}} level sanctions within the past year",
          tooltip:
            'Per policy 12.4.01.06, {{#if (eq sanctionType "high")}}reentrants must have had a "satisfactory adjustment" over their supervision period. This tool uses a lack of high sanctions in the past year as a proxy for satisfactory adjustment while on supervision. {{else}}"special probation and special parole cases...with one year or more of successful supervision with no medium or high-level sanctions" are eligible for SPC.{{/if}}',
        },
        {
          key: "usPaNotEligibleOrMarkedIneligibleForAdminSupervision",
          text: "Not eligible for administrative supervision",
        },
        {
          key: "usPaNotOnSexOffenseProtocol",
          text: "Not designated as a sex offender",
          tooltip:
            "A reentrant is considered a sex offender if they have a problem area of “Sex Offender” checked in Captor or have any special conditions or treatments that relate to sex offenders or Megan’s Law ",
        },
        {
          key: "notSupervisionPastFullTermCompletionDateOrUpcoming90Days",
          text: "Not within 90 days of max date",
        },
      ],
      emptyTabCopy: [],
      firestoreCollection: "US_PA-specialCircumstancesSupervisionReferrals",
      hideDenialRevert: false,
      highlightCasesOnHomepage: false,
      highlightedCaseCtaCopy: null,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [
        {
          key: "usPaMeetsSpecialCircumstancesCriteriaForTimeServed",
          text: "Needs {{daysUntil eligibleDate}} more days on supervision",
        },
      ],
      initialHeader: null,
      isAlert: false,
      markSubmittedOptionsByTab: [],
      methodologyUrl:
        "https://docs.google.com/document/d/e/2PACX-1vSdsgMDOmD7tR_IP8NwqYggO6w9MBsAdB3jZp8ZEfWSseoGw0_6gBuF1hw6AGUskESpnA7htA8uct_y/pub",
      nonOmsCriteria: [
        {
          text: "Making efforts to reduce financial obligations",
          tooltip:
            "See intranet (Act 35 - Supervision Financial Obligations section) or UJS site for financial obligations",
        },
        {
          text: "Has fulfilled treatment and special condition requirements",
          tooltip:
            "See below for list of treatments and relevant special conditions",
        },
      ],
      nonOmsCriteriaHeader: "Requirements for agents to check",
      notifications: [],
      omsCriteriaHeader: "Requirements fulfilled",
      overdueOpportunityCalloutCopy: null,
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 180 },
      snoozeCompanionOpportunityTypes: [],
      stateCode: "US_PA",
      strictlyIneligibleCriteriaCopy: [],
      subcategoryHeadings: [],
      subcategoryOrderings: [],
      subheading:
        "Special circumstances supervision allows reentrants who are not eligible for traditional administrative supervision to be supervised at a lower level of supervision. It is typically used for reentrants who have extenuating circumstances that reduce the risk of re-offending or reentrants who have made satisfactory adjustments on supervision over a period of time.<br><br>On this page, you can review clients who may be eligible for special circumstances supervision. For more information, please refer to the [supervision levels policy](https://drive.google.com/file/d/1MeqGQPvWNytOhUJCYsevoXwtTOEK0TIh/view) and [violent offenses list](https://drive.google.com/file/d/1UIhv6lkByGwtZBOqqO8Y9cRG_n1wMQrT/view?usp=sharing) or learn more about [our methodology](https://docs.google.com/document/d/e/2PACX-1vSdsgMDOmD7tR_IP8NwqYggO6w9MBsAdB3jZp8ZEfWSseoGw0_6gBuF1hw6AGUskESpnA7htA8uct_y/pub). ",
      submittedTabTitle: "Pending Review",
      supportsIneligible: false,
      supportsSubmitted: true,
      systemType: "SUPERVISION",
      tabGroups: null,
      tabPrefaceCopy: [],
      tooltipEligibilityText: null,
      urlSection: "specialCircumstancesSupervisionReferrals",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
