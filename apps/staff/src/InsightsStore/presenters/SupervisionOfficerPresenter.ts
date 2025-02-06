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

import { flowResult, makeObservable, override } from "mobx";

import { FlowMethod, HydratesFromSource } from "~hydration-utils";

import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { InsightsAPI } from "../api/interface";
import { WithJusticeInvolvedPersonStore } from "../mixins/WithJusticeInvolvedPersonsPresenterMixin";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenterBase } from "./SupervisionOfficerPresenterBase";
import { HighlightedOfficersDetail } from "./types";
import {
  getHighlightedOfficersByMetric,
  isExcludedSupervisionOfficer,
} from "./utils";

export class SupervisionOfficerPresenter extends WithJusticeInvolvedPersonStore(
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
      SupervisionOfficerPresenter,
      | "populateSupervisionOfficer"
      | "expectClientsPopulated"
      | "populateCaseload"
    >(this, {
      isWorkflowsEnabled: true,
      expectClientsPopulated: true,
      populateCaseload: true,
      clients: true,
      numClientsOnCaseload: true,
      populateSupervisionOfficer: override,
      hydrate: override,
      hydrationState: override,
    });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        ...super.expectPopulated(),
        () => this.expectClientsPopulated(this.officerExternalId),
      ],
      populate: async () => {
        await Promise.all(super.populateMethods());
        // These need to happen after the above calls so that the officer record is hydrated
        await Promise.all([
          this.populateCaseload(),
          flowResult(this.populateSupervisionOfficerOutcomes()),
        ]);
      },
    });
  }

  private async populateCaseload() {
    if (!this.isWorkflowsEnabled || !this.officerExternalId) return;
    await this.populateOpportunitiesForOfficer(this.officerExternalId);
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

  /**
   * Passthrough to the SupervisionStore
   * Checks if Vitals is enabled based on user permissions.
   * @returns `true` if vitals is enabled, otherwise `false`.
   */
  get isVitalsEnabled() {
    return this.supervisionStore.isVitalsEnabled;
  }

  /**
   * Returns metrics where this officer meets the top X percent criteria.
   * @returns An array of objects containing the metric, top X percent criteria, and info about
   * officers meeting the top X percent criteria. Returns empty array for officers
   * excluded from outcomes.
   */
  get officerHighlights(): HighlightedOfficersDetail[] {
    // Not expected in practice, but needed for type safety
    if (!this.officerOutcomes || !this.officerRecord) {
      throw new Error("Missing necessary officer data");
    }

    return getHighlightedOfficersByMetric(
      this.metricConfigsById,
      [this.officerRecord],
      [this.officerOutcomes],
    );
  }

  protected expectMetricsPopulated() {
    if (isExcludedSupervisionOfficer(this.fetchedOfficerRecord)) return;
    super.expectMetricsPopulated();
  }

  /**
   * Fetch record for current officer.
   */
  protected *populateSupervisionOfficer(): FlowMethod<
    InsightsAPI["supervisionOfficer"],
    void
  > {
    if (this.isOfficerPopulated) return;

    this.fetchedOfficerRecord =
      yield this.supervisionStore.insightsStore.apiClient.supervisionOfficer(
        this.officerPseudoId,
      );
  }
}
