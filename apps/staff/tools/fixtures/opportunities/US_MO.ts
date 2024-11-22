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
    usMoOverdueRestrictiveHousingInitialHearing: {
      callToAction:
        "Review residents and prepare necessary paperwork for their hearing.",
      compareBy: [
        { field: "eligibilityDate", undefinedBehavior: "undefinedFirst" },
      ],
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
      displayName: "Temporary Assignment",
      dynamicEligibilityText:
        "resident[|s] on Temporary Assignment to review for their initial meaningful hearing",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      firestoreCollection:
        "US_MO-overdueRestrictiveHousingInitialHearingReferrals",
      hideDenialRevert: false,
      homepagePosition: 3,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: true,
      methodologyUrl:
        "https://drive.google.com/file/d/1IyslsgIVlpACCtEeTmJKFttEp0Fmuc9A/view?usp=sharing",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["UsMoIncarceration", "UsMoRestrictiveHousing"],
      snooze: {
        autoSnoozeParams: {
          params: { weekday: "Sunday" },
          type: "snoozeUntil",
        },
      },
      stateCode: "US_MO",
      subheading:
        "This alert helps staff identify residents in Temporary Assignment who are overdue or due for an initial meaningful hearing.",
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
      tooltipEligibilityText: null,
      urlSection: "overdueRestrictiveHousingInitialHearing",
      zeroGrantsTooltip: null,
    },
    usMoOverdueRestrictiveHousingRelease: {
      callToAction:
        "Review residents for release and prepare necessary paperwork for their return to general population.",
      compareBy: [
        { field: "eligibilityDate", undefinedBehavior: "undefinedFirst" },
      ],
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
      displayName: "Release from Restrictive Housing",
      dynamicEligibilityText:
        "resident[|s] to review for release from Restrictive Housing",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      firestoreCollection: "US_MO-overdueRestrictiveHousingReleaseReferrals",
      hideDenialRevert: false,
      homepagePosition: 2,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: true,
      methodologyUrl:
        "https://drive.google.com/file/d/1IyslsgIVlpACCtEeTmJKFttEp0Fmuc9A/view?usp=sharing",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["UsMoIncarceration", "UsMoRestrictiveHousing"],
      snooze: {
        autoSnoozeParams: {
          params: { weekday: "Sunday" },
          type: "snoozeUntil",
        },
      },
      stateCode: "US_MO",
      subheading:
        "This alert helps staff identify residents in Restrictive Housing who have already reached or are about to reach the total number of days they were assigned to serve in restrictive housing before returning to the General Population. Review residents for release and prepare necessary paperwork for their return to the General Population.",
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
      tooltipEligibilityText: null,
      urlSection: "overdueRestrictiveHousingRelease",
      zeroGrantsTooltip: null,
    },
    usMoOverdueRestrictiveHousingReviewHearing: {
      callToAction:
        "Review residents and prepare necessary paperwork for their next hearing",
      compareBy: [
        { field: "eligibilityDate", undefinedBehavior: "undefinedFirst" },
      ],
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
      displayName: "Extended Restrictive Housing Review",
      dynamicEligibilityText:
        "resident[|s] in Extended Restrictive Housing to review for their next hearing",
      eligibilityDateText: null,
      eligibleCriteriaCopy: [],
      firestoreCollection:
        "US_MO-overdueRestrictiveHousingReviewHearingReferrals",
      hideDenialRevert: false,
      homepagePosition: 4,
      ineligibleCriteriaCopy: [],
      initialHeader: null,
      isAlert: true,
      methodologyUrl:
        "https://drive.google.com/file/d/1IyslsgIVlpACCtEeTmJKFttEp0Fmuc9A/view?usp=sharing",
      notifications: [],
      priority: "NORMAL",
      sidebarComponents: ["UsMoIncarceration", "UsMoRestrictiveHousing"],
      snooze: {
        autoSnoozeParams: {
          params: { weekday: "Sunday" },
          type: "snoozeUntil",
        },
      },
      stateCode: "US_MO",
      subheading:
        "This alert helps staff identify residents in Extended Restrictive Housing  who are overdue or due for a hearing. Review residents and prepare necessary paperwork for their next hearing.",
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
      tooltipEligibilityText: null,
      urlSection: "overdueRestrictiveHousingReviewHearing",
      zeroGrantsTooltip: null,
    },
  },
} as const satisfies ApiOpportunityConfigurationResponse;
