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

import { Client, Opportunity, OpportunityType } from "../../WorkflowsStore";
import { FormBase } from "../../WorkflowsStore/Opportunity/Forms/FormBase";
import { OpportunityBase } from "../../WorkflowsStore/Opportunity/OpportunityBase";

export const MockFormBase: FormBase<any> = {
  client: {} as Client,
  opportunity: {} as OpportunityBase<any, any>,
  formLastUpdated: undefined,
  draftData: {},
  prefilledData: {},
  formData: {},
  printText: "",
  navigateToFormText: "",
  prefilledDataTransformer: () => ({}),
  type: "pastFTRD" as OpportunityType,
};

export const mockOpportunity: Opportunity = {
  almostEligible: false,
  client: {} as Client,
  defaultEligibility: "ELIGIBLE",
  denial: undefined,
  denialReasonsMap: {},
  firstViewed: undefined,
  hydrate: () => undefined,
  isHydrated: true,
  requirementsAlmostMet: [],
  requirementsMet: [],
  reviewStatus: "PENDING",
  setFirstViewedIfNeeded: () => undefined,
  setCompletedIfEligible: () => undefined,
  type: "pastFTRD",
  eligibilityDate: undefined,
  isAlert: false,
  supportsDenial: false,
};
