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

import { OpportunityType } from "~datatypes";
import { HydrationState } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import { JusticeInvolvedPersonBase } from "../../../WorkflowsStore/JusticeInvolvedPersonBase";
import { MOCK_OPPORTUNITY_CONFIGS } from "../../../WorkflowsStore/Opportunity/__fixtures__";
import { OpportunityBase } from "../../../WorkflowsStore/Opportunity/OpportunityBase";

/**
 * Mock Opportunity for testing Workflows functionality in Insights
 */
export class MockOpportunity {
  constructor(
    public person: JusticeInvolvedPersonBase,
    public type: OpportunityType,
    public rootStore: RootStore,
  ) {}

  get config() {
    return MOCK_OPPORTUNITY_CONFIGS[this.type];
  }

  hydrate() {
    return;
  }

  get hydrationState() {
    return { status: "hydrated" } as HydrationState;
  }
}

/**
 * Function that gives constructor for a MockOpportunity of the given type.
 *
 * Consider using to mock as a value on an `OpportunityFactory`, like `supervisionOpportunityConstructors`
 */
export function getMockOpportunityConstructor(type: OpportunityType) {
  return class extends MockOpportunity {
    constructor(person: JusticeInvolvedPersonBase, rootStore: RootStore) {
      super(person, type, rootStore);
    }
  } as unknown as OpportunityBase<JusticeInvolvedPersonBase, any, any>;
}
