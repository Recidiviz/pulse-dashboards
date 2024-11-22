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
    usPaAdminSupervision: {
      callToAction: "Review clients and complete the DC-P 402 checklist",
      compareBy: null,
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
          key: "OUT OF STATE",
          text: "Client has an out of state offense that makes them ineligible per form 402",
        },
        {
          key: "UNREPORTED",
          text: "Client has an unreported disposition on an offense that makes them ineligible per form 402",
        },
        {
          key: "DRUG",
          text: "Client has a drug offense that makes them ineligible per form 402a",
        },
        {
          key: "SEX",
          text: "Client has been designated as a sexually violent predator",
        },
        {
          key: "DUI",
          text: " Client was charged with 75 PA C.S. 3731 relating to DUI/Controlled Substance and their case involved bodily injury",
        },
        {
          key: "OBSC",
          text: "Client was charged with 18 PA. C.S. 5903(4)(5)(6) relating to obscene/sexual material/performance and the victim was a minor",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      displayName: "Administrative Supervision",
      dynamicEligibilityText:
        "client[|s] may be eligible for transfer to Adminstrative Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "onParoleAtLeastOneYear",
          text: "Has served on parole for at least one year",
        },
        {
          key: "usPaNoHighSanctionsInPastYear",
          text: "Has not incurred high sanctions within the last year",
        },
        {
          key: "usPaNotServingIneligibleOffenseForAdminSupervision",
          text: "Not serving for an ineligible offense",
        },
        {
          key: "usPaNotOnSexOffenseProtocol",
          text: "Not supervised under the sex offender protocol",
        },
      ],
      firestoreCollection: "US_PA-adminSupervisionReferrals",
      hideDenialRevert: false,
      homepagePosition: 1,
      ineligibleCriteriaCopy: [
        {
          key: "onParoleAtLeastOneYear",
          text: "Needs {{monthsOrDaysRemainingFromToday eligibleDate}} on supervision",
        },
      ],
      initialHeader: null,
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1dBTArU-kQojSvqWZ_i080pDtXxZe70X6/view",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "ClientEmployer"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_PA",
      subheading:
        "Administrative supervision is a level of supervision that requires less contact than the minimum supervision level. It requires at least one face-to-face contact and one collateral contact per year. The official policy doc can be found [here](https://drive.google.com/file/d/1MeqGQPvWNytOhUJCYsevoXwtTOEK0TIh/view). On this page, you can review clients and complete the DC-P 402 form.",
      systemType: "SUPERVISION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "adminSupervision",
      zeroGrantsTooltip: null,
    },
    usPaSpecialCircumstancesSupervision: {
      callToAction:
        "Review clients and transfer to administrative supervision caseload",
      compareBy: null,
      denialReasons: [
        {
          key: "SATISFACTORY",
          text: "Client has not had a satisfactory adjustment over their term of supervision",
        },
        {
          key: "SPECIAL CONDITIONS",
          text: "Client has not fulfilled special conditions or treatment requirements",
        },
        { key: "Other", text: "Other, please specify a reason" },
      ],
      denialText: null,
      displayName: "Special Circumstances Supervision",
      dynamicEligibilityText:
        "client[|s] may be eligible for transfer to Special Circumstances Supervision",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [
        {
          key: "usPaMeetsSpecialCircumstancesCriteriaForTimeServed",
          text: "Currently serving a {{caseType}} and has served on supervision for {{yearsRequiredToServe}} years",
          tooltip:
            "Other reentrant categories that can be considered for the SPC include:\n(a) those serving a life sentence...over a seven year period\n(b) a non-life sentenced reentrant (violent case)...over a five-year period\n(c) a non-life sentenced reentrant (non-violent case)...over a three-year period\n(d) special probation and special parole cases that have had one year or more of successful supervision",
        },
        {
          key: "usPaMeetsSpecialCircumstancesCriteriaForSanctions",
          text: "No {{sanctionType}} level sanctions within the past year.",
          tooltip:
            "Other reentrant categories that can be considered for the SPC include: \n(a) [reentrants] with a satisfactory adjustment\n(b) special probation and special parole cases... with one year or more of successful supervision with no medium or\nhigh-level sanctions",
        },
        {
          key: "usPaNotEligibleOrMarkedIneligibleForAdminSupervision",
          text: "Not eligible for administrative supervision",
        },
      ],
      firestoreCollection: "US_PA-specialCircumstancesSupervisionReferrals",
      hideDenialRevert: false,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [
        {
          key: "usPaMeetsSpecialCircumstancesCriteriaForTimeServed",
          text: "Needs {{daysUntil eligibleDate}} more days on supervision",
        },
      ],
      initialHeader: null,
      isAlert: false,
      methodologyUrl:
        "https://drive.google.com/file/d/1dBTArU-kQojSvqWZ_i080pDtXxZe70X6/view",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["ClientProfileDetails", "ClientEmployer"],
      snooze: { defaultSnoozeDays: 30, maxSnoozeDays: 90 },
      stateCode: "US_PA",
      subheading:
        "Special circumstances supervision allows reentrants who are not eligible for traditional administrative supervision to be supervised at a lower level of supervision. It is typically used for reentrants who have extenuating circumstances that reduce the risk of re-offending or reentrants who have made satisfactory adjustments on supervision over a period of time. The official policy doc can be found [here](https://drive.google.com/file/d/1MeqGQPvWNytOhUJCYsevoXwtTOEK0TIh/view). On this page, you can review clients who may be eligible for special circumstances supervision. ",
      systemType: "SUPERVISION",
      tabGroups: null,
      tooltipEligibilityText: null,
      urlSection: "specialCircumstancesSupervisionReferrals",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
