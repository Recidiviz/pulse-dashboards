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

import { JusticeInvolvedPersonsStore } from "../../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { WithJusticeInvolvedPersonStore } from "../WithJusticeInvolvedPersonsPresenterMixin";
import { MockSupervisionBasePresenter } from "./MockSupervisionBasePresenter";

/**
 * This is needed for visibility into the mixin because its methods are protected.
 */
export class MockSupervisionPresenterWithJiiMixin extends WithJusticeInvolvedPersonStore(
  MockSupervisionBasePresenter,
) {
  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    officerPseudoId: string,
    justiceInvolvedPersonStore: JusticeInvolvedPersonsStore,
  ) {
    super(supervisionStore, officerPseudoId);
    this.justiceInvolvedPersonsStore = justiceInvolvedPersonStore;
  }

  findClientsForOfficer = super.findClientsForOfficer;
  countVerifiedOpportunitiesForOfficer = super
    .countVerifiedOpportunitiesForOfficer;
  verifiedOpportunitiesByTypeForOfficer = super
    .verifiedOpportunitiesByTypeForOfficer;
  expectClientsPopulated = super.expectClientsPopulated;
  expectClientsForOfficersPopulated = super.expectClientsForOfficersPopulated;
}
