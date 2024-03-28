// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { add } from "date-fns";

import { OpportunityConfig } from "../../OpportunityConfigs";
import { UsTnExpirationOpportunity } from "./UsTnExpirationOpportunity";

export const usTnExpirationConfig: OpportunityConfig<UsTnExpirationOpportunity> =
  {
    systemType: "SUPERVISION",
    stateCode: "US_TN",
    urlSection: "expiration",
    label: "Expiration",
    featureVariant: "usTnExpiration",
    initialHeader:
      "Search for officers above to review clients who may be on or past their supervision expiration date.",
    dynamicEligibilityText:
      "client[|s] may be on or past their expiration date",
    callToAction:
      "Review these clients and complete their auto-generated TEPE Note.",
    firestoreCollection: "US_TN-expirationReferrals",
    snooze: {
      defaultSnoozeUntilFn: (snoozedOn: Date) => add(snoozedOn, { days: 30 }),
    },
    denialReasons: {
      DATE: "DATE: Expiration date is incorrect or missing",
      Other: "Other: please specify a reason",
    },
    methodologyUrl:
      "https://drive.google.com/file/d/1IpetvPM49g_c-D-HzGdf7v6QAe_z5IHn/view?usp=sharing",
    sidebarComponents: ["ClientProfileDetails", "CaseNotes"],
    eligibleCriteriaCopy: {
      supervisionPastFullTermCompletionDateOrUpcoming1Day: {
        text: `{{#if (eq 0 (daysPast eligibleDate))}}Expiration date is today{{else}}{{#if (eq 1 (daysPast eligibleDate))}}1 day{{else}}{{daysPast eligibleDate}} days{{/if}} past expiration date{{/if}} ({{date eligibleDate}})`,
      },
      usTnNoZeroToleranceCodesSpans: {
        text: "No zero tolerance codes since most recent sentence imposed date",
      },
      usTnNotOnLifeSentenceOrLifetimeSupervision: {
        text: "Not on lifetime supervision or lifetime sentence",
      },
    },
  };
