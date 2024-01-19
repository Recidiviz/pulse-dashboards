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

import { AutoSnoozeUpdate, ManualSnoozeUpdate } from "../../FirestoreStore";
import { Client, Opportunity } from "../../WorkflowsStore";
import { OTHER_KEY } from "../../WorkflowsStore/utils";

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
  denialReasonsMap: { CODE: "Denial Code", [OTHER_KEY]: "Other" },
  lastViewed: undefined,
  hydrate: () => undefined,
  hydrationState: { status: "hydrated" },
  policyOrMethodologyUrl: "https://example.com",
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
  isAlert: false,
  isSnoozed: false,
  supportsDenial: false,
  trackListViewed: () => undefined,
  trackPreviewed: () => undefined,
  opportunityProfileModules: [],
  supportsExternalRequest: false,
  tabOrder: ["Eligible Now"],
  deniedTabTitle: "Marked Ineligible",
  tabTitle: "Eligible Now",
  compare: () => 1,
  showEligibilityStatus: () => true,
};
