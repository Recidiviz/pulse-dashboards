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

import { makeObservable, override } from "mobx";

import { HydratesFromSource } from "~hydration-utils";

import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenterBase } from "./SupervisionOfficerPresenterBase";
import { isExcludedSupervisionOfficer } from "./utils";

export class SupervisionOfficerPagePresenter extends WithJusticeInvolvedPersonStore(
  SupervisionOfficerPresenterBase,
) {
  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public officerPseudoId: string,
    justiceInvolvedPersonStore: JusticeInvolvedPersonsStore,
  ) {
    super(supervisionStore, officerPseudoId);
    this.justiceInvolvedPersonsStore = justiceInvolvedPersonStore;

    makeObservable<
      SupervisionOfficerPagePresenter,
      "expectCaseloadPopulated" | "populateCaseload"
    >(this, {
      isWorkflowsEnabled: true,
      expectCaseloadPopulated: true,
      populateCaseload: true,
      clients: true,
      numClientsOnCaseload: true,
      hydrate: override,
      hydrationState: override,
    });

    this.personFieldsToHydrate = ["opportunityManager"];

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        ...this.expectPopulated(),
        ...this.expectOutcomesDependenciesPopulated(),
        () => this.expectCaseloadPopulated(this.officerExternalId),
      ],
      populate: async () => {
        await Promise.all(super.populateMethods());
        // These need to happen after the above calls so that the officer record is hydrated
        await Promise.all([
          this.populateCaseload(),
          this.populateSupervisionOfficerOutcomes(),
        ]);
      },
    });
  }

  private async populateCaseload() {
    if (!this.isWorkflowsEnabled || !this.officerExternalId) return;
    await this.populateCaseloadForOfficer(this.officerExternalId);
  }

  // TODO(#5780): move to infoItems presenter
  get clients(): JusticeInvolvedPerson[] | undefined {
    return this.officerExternalId
      ? this.findClientsForOfficer(this.officerExternalId)
      : undefined;
  }
  // TODO(#5780): move to infoItems presenter
  get numClientsOnCaseload(): number | undefined {
    return this.clients?.length;
  }

  protected expectMetricsPopulated() {
    if (isExcludedSupervisionOfficer(this.fetchedOfficerRecord)) return;
    super.expectMetricsPopulated();
  }
}
