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

import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { SupervisionBasePresenter } from "../../presenters/SupervisionBasePresenter";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";

/**
 * Mock presenter that allows us to test a mixin independently of which presenter it's
 * being applied to.
 *
 * If the mixin is constrained to {@link SupervisionBasePresenter}, it must be tested
 * with this mock.
 */
export class MockSupervisionBasePresenter
  extends SupervisionBasePresenter
  implements SupervisionBasePresenter, Hydratable
{
  protected hydrator: HydratesFromSource;

  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public officerPseudoId: string,
  ) {
    super(supervisionStore);
    this.hydrator = new HydratesFromSource({
      expectPopulated: [],
      populate: async () => {
        return;
      },
    });
  }
  /**
   * Initiates hydration for all data needed within this presenter class
   */
  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get hydrationState() {
    return this.hydrator.hydrationState;
  }
}
