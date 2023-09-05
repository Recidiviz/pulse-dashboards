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

import { Client, Opportunity } from "../../WorkflowsStore";

export const mockOpportunity: Opportunity<Client> = {
  record: {},
  almostEligible: false,
  person: {} as Client,
  defaultEligibility: "ELIGIBLE",
  denial: undefined,
  denialReasonsMap: {},
  lastViewed: undefined,
  hydrate: () => undefined,
  isHydrated: true,
  policyOrMethodologyUrl: "https://example.com",
  requirementsAlmostMet: [],
  requirementsMet: [],
  reviewStatus: "PENDING",
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
  sectionOrder: ["Eligible Now"],
  deniedSectionTitle: "Marked Ineligible",
  sectionTitle: "Eligible Now",
  showEligibilityStatus: () => true,
};
