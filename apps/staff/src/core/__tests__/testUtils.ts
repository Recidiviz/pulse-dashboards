// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { mapValues } from "lodash";

import { AutoSnoozeUpdate, ManualSnoozeUpdate } from "../../FirestoreStore";
import { Client, Opportunity, OpportunityTab } from "../../WorkflowsStore";
import { OPPORTUNITY_CONFIGS } from "../../WorkflowsStore/Opportunity/OpportunityConfigs";
import { formatEligibilityText } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/models/ApiOpportunityConfigurationImpl";
import { LocalOpportunityConfiguration } from "../../WorkflowsStore/Opportunity/OpportunityConfigurations/models/LocalOpportunityConfigurationImpl";
import { generateTabs } from "../../WorkflowsStore/Opportunity/utils/tabUtils";
import { OTHER_KEY } from "../../WorkflowsStore/utils";

export const mockOpportunityConfigs = mapValues(
  OPPORTUNITY_CONFIGS,
  (rawConfig) =>
    new LocalOpportunityConfiguration(rawConfig, {
      featureVariants: {},
    } as any),
);

export const mockOpportunity: Opportunity<Client> = {
  record: {},
  almostEligible: false,
  person: {
    displayPreferredName: "Client Name",
    recordId: "123",
    stateCode: "US_OZ",
    expirationDate: new Date(2025, 1, 1),
  } as Client,
  defaultEligibility: "ELIGIBLE",
  denial: undefined,
  lastViewed: undefined,
  hydrate: () => undefined,
  hydrationState: { status: "hydrated" },
  requirementsAlmostMet: [],
  requirementsMet: [],
  reviewStatus: "PENDING",
  snoozedBy: undefined,
  snoozedOnDate: new Date(),
  manualSnooze: {} as ManualSnoozeUpdate,
  autoSnooze: {} as AutoSnoozeUpdate,
  manualSnoozeUntilDate: undefined,
  deleteOpportunityDenialAndSnooze: async () => undefined,
  setAutoSnooze: async () => undefined,
  setManualSnooze: async () => undefined,
  setLastViewed: () => undefined,
  setDenialReasons: async () => undefined,
  setCompletedIfEligible: () => undefined,
  setOtherReasonText: async () => undefined,
  type: "pastFTRD",
  eligibilityDate: undefined,
  isSnoozed: false,
  supportsDenial: false,
  trackListViewed: () => undefined,
  trackPreviewed: () => undefined,
  supportsExternalRequest: false,
  deniedTabTitle: "Marked Ineligible",
  tabTitle: () => "Eligible Now",
  compare: () => 1,
  showEligibilityStatus: () => true,
  config: {
    systemType: "SUPERVISION",
    stateCode: "US_ID",
    urlSection: "pastFTRD",
    label: "Past FTRD",
    initialHeader:
      "Search for officers above to review clients whose full-term release date is near or has passed.",
    eligibilityTextForCount(count) {
      return formatEligibilityText(
        "client[|s] [is|are] nearing or past their full-term release date",
        count,
      );
    },
    callToAction:
      "Review clients who are nearing or past their full-term release date and email clerical to move them to history.",
    compareBy: [{ field: "reviewStatus" }],
    firestoreCollection: "US_ID-pastFTRDReferrals",
    snooze: {
      autoSnoozeParams: (snoozedOn: Date) => add(snoozedOn, { days: 30 }),
    },
    tabGroups: {
      "ELIGIBILITY STATUS": generateTabs({
        isAlert: false,
      }) as OpportunityTab[],
    },
    isEnabled: true,
    denialReasons: { CODE: "Denial Code", [OTHER_KEY]: "Other" },
    methodologyUrl: "https://example.com",
    sidebarComponents: [],
    isAlert: false,
    eligibleCriteriaCopy: {},
    ineligibleCriteriaCopy: {},
  },
};
