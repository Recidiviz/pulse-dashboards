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
    compliantReporting: {
      callToAction:
        "Review and refer eligible clients for Compliant Reporting.",
      compareBy: null,
      denialReasons: {
        DECF: "DECF: No effort to pay fine and costs",
        DECR: "DECR: Criminal record",
        DECT: "DECT: Insufficient time in supervision level",
        DEDF: "DEDF: No effort to pay fees",
        DEDU: "DEDU: Serious compliance problems ",
        DEIJ: "DEIJ: Not allowed per court",
        DEIR: "DEIR: Failure to report as instructed",
        Other: "Other, please specify a reason",
      },
      denialText: null,
      displayName: "Compliant Reporting",
      dynamicEligibilityText:
        "client[|s] may be eligible for Compliant Reporting",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {},
      firestoreCollection: "compliantReportingReferrals",
      hideDenialRevert: false,
      homepagePosition: 1,
      ineligibleCriteriaCopy: {},
      initialHeader: null,
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1YNAUTViqg_Pgt15KsZPUiNG11Dh2TTiB/view",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: [
        "SpecialConditions",
        "ClientProfileDetails",
        "FinesAndFees",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_TN",
      subheading:
        "Compliant Reporting is a level of supervision that uses an interactive voice recognition system, rather than requiring regular face-to-face contacts. Review and refer eligible clients for Compliant Reporting using the autofilled paperwork.",
      systemType: "SUPERVISION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "compliantReporting",
    },
    supervisionLevelDowngrade: {
      callToAction: "Change their supervision level in TOMIS.",
      compareBy: null,
      denialReasons: {
        COURT: "COURT: Court mandates supervision at a higher level",
        Other: "Other: please specify a reason",
      },
      denialText: null,
      displayName: "Supervision Level Downgrade",
      dynamicEligibilityText:
        "client[|s] may be supervised at a higher level than their latest risk score",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        supervisionLevelHigherThanAssessmentLevel: {
          text: "Current supervision level: {{supervisionLevel}}; Last risk score: {{assessmentLevel}} {{#if latestAssessmentDate}}(as of {{date latestAssessmentDate}}){{else}}(assessment date unknown){{/if}}",
        },
      },
      firestoreCollection: "US_TN-supervisionLevelDowngrade",
      hideDenialRevert: false,
      homepagePosition: 4,
      ineligibleCriteriaCopy: {},
      initialHeader: null,
      isAlert: true,
      methodologyUrl:
        "https://drive.google.com/file/d/1fkqncNb_GNYBvRfOgij4QHw4HEdkkHHz/view",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_TN",
      subheading:
        "This alert helps staff identify people who may be supervised at a higher level than their latest risk score and directs staff to update their supervision level in eTOMIS.\n  \nClients are surfaced if their latest risk score does not map to the corresponding supervision level as detailed below:\n\n* Low - Minimum or lower\n* Moderate - Medium or lower\n* High Property - Max or lower\n    ",
      systemType: "SUPERVISION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "supervisionLevelDowngrade",
    },
    usTnAnnualReclassification: {
      callToAction:
        "Review residents due for their annual reclassification and update their custody level in TOMIS.",
      compareBy: [{ field: "releaseDate" }],
      denialReasons: {
        OVERRIDE: "Reclassification date override",
        Other: "Please specify a reason",
      },
      denialText: null,
      displayName: "Annual Reclassification",
      dynamicEligibilityText:
        "resident[|s] [is|are] eligible for their annual reclassification",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        usTnAtLeast12MonthsSinceLatestAssessment: {
          text: "At least 12 months since last reclassification date",
        },
        custodyLevelIsNotMax: { text: "Custody level is not maximum" },
      },
      firestoreCollection: "US_TN-annualReclassificationReferrals",
      hideDenialRevert: false,
      homepagePosition: 4,
      ineligibleCriteriaCopy: {},
      initialHeader: null,
      isAlert: false,
      methodologyUrl: "",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "CaseNotes",
        "UsTnCommonlyUsedOverrideCodes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_TN",
      subheading:
        "This alert helps staff identify residents who are due for annual custody reclassification and directs staff to complete & submit new classification paperwork.",
      systemType: "INCARCERATION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "annualReclassification",
    },
    usTnCustodyLevelDowngrade: {
      callToAction: "Review and update custody levels.",
      compareBy: null,
      denialReasons: { Other: "Please specify a reason" },
      denialText: null,
      displayName: "Custody Level Downgrade",
      dynamicEligibilityText:
        "resident[|s] may be eligible for a custody level downgrade",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        custodyLevelHigherThanRecommended: {
          text: "Custody level is higher than latest CAF score suggests",
        },
        custodyLevelIsNotMax: { text: "Custody level is not maximum" },
        usTnIneligibleForAnnualReclassification: {
          text: "Not eligible for annual reclassification",
        },
        usTnLatestCafAssessmentNotOverride: {
          text: "Last assessment did not include an override",
        },
      },
      firestoreCollection: "US_TN-custodyLevelDowngradeReferrals",
      hideDenialRevert: false,
      homepagePosition: 2,
      ineligibleCriteriaCopy: {},
      initialHeader: null,
      isAlert: false,
      methodologyUrl: "",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: [
        "Incarceration",
        "CaseNotes",
        "UsTnCommonlyUsedOverrideCodes",
      ],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_TN",
      subheading:
        "This alert helps staff identify residents who may be at a higher custody level than recommended and directs staff to complete & submit new classification paperwork based on the resident's latest CAF score.",
      systemType: "INCARCERATION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "custodyLevelDowngrade",
    },
    usTnExpiration: {
      callToAction:
        "Review these clients and complete their auto-generated TEPE Note.",
      compareBy: null,
      denialReasons: {
        DATE: "DATE: Expiration date is incorrect or missing",
        Other: "Other: please specify a reason",
      },
      denialText: null,
      displayName: "Expiration",
      dynamicEligibilityText:
        "client[|s] may be on or past their expiration date",
      eligibilityDateText: null,
      eligibleCriteriaCopy: {
        supervisionPastFullTermCompletionDateOrUpcoming1Day: {
          text: "{{#if (eq 0 (daysPast eligibleDate))}}Expiration date is today{{else}}{{#if (eq 1 (daysPast eligibleDate))}}1 day{{else}}{{daysPast eligibleDate}} days{{/if}} past expiration date{{/if}} ({{date eligibleDate}})",
        },
        usTnNoZeroToleranceCodesSpans: {
          text: "No zero tolerance codes since most recent sentence imposed date",
        },
        usTnNotOnLifeSentenceOrLifetimeSupervision: {
          text: "Not on lifetime supervision or lifetime sentence",
        },
      },
      firestoreCollection: "US_TN-expirationReferrals",
      hideDenialRevert: false,
      homepagePosition: 3,
      ineligibleCriteriaCopy: {},
      initialHeader:
        "Search for officers above to review clients who may be on or past their supervision expiration date.",
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1IpetvPM49g_c-D-HzGdf7v6QAe_z5IHn/view?usp=sharing",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
      snooze: {
        autoSnoozeParams: { type: "snoozeDays", params: { days: 30 } },
      },
      stateCode: "US_TN",
      subheading:
        "This alert helps staff identify clients whose expiration dates are today or in the past. Complete a pre-populated discharge note (TEPE) and copy note to eTOMIS.",
      systemType: "SUPERVISION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "expiration",
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
