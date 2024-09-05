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

import { descending } from "d3-array";
import { pick } from "lodash/fp";
import { flowResult, makeAutoObservable } from "mobx";
import moment from "moment";

import {
  ClientEvent,
  ClientInfo,
  SupervisionOfficerMetricEvent,
} from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { ConfigLabels, SupervisionDetails } from "./types";

export class SupervisionClientDetailPresenter implements Hydratable {
  constructor(
    private supervisionStore: InsightsSupervisionStore,
    public officerPseudoId: string,
    public clientPseudoId: string,
    public metricId: string,
    public outcomeDate: Date,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        this.expectEventsPopulated,
        this.expectProfileInfoHydrated,
      ],
      populate: async () => {
        await Promise.all([
          flowResult(
            this.supervisionStore.populateClientEventsForClient(
              this.clientPseudoId,
              this.outcomeDate,
            ),
          ),
          flowResult(
            this.supervisionStore.populateClientInfoForClient(
              this.clientPseudoId,
            ),
          ),
          flowResult(
            this.supervisionStore.populateMetricEventsForOfficer(
              this.officerPseudoId,
              this.metricId,
            ),
          ),
          flowResult(this.supervisionStore.populateMetricConfigs()),
        ]);
      },
    });
  }

  private hydrator: HydratesFromSource;

  private expectEventsPopulated() {
    if (!this.clientEvents) throw new Error("Failed to populate client events");
  }

  private expectProfileInfoHydrated() {
    if (!this.clientInfo)
      throw new Error("Failed to populate client profile info");
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

  get clientEvents(): ClientEvent[] | undefined {
    const events =
      this.supervisionStore.clientEventsByClientPseudoIdAndOutcomeDate
        .get(this.clientPseudoId)
        ?.get(this.outcomeDate.toISOString());

    return events?.slice().sort((a, b) => descending(a.eventDate, b.eventDate));
  }

  get clientInfo(): ClientInfo | undefined {
    return this.supervisionStore.clientInfoByClientPseudoId.get(
      this.clientPseudoId,
    );
  }

  get eventsLabel(): string {
    return (
      this.supervisionStore.metricConfigsById?.get(this.metricId)?.eventName ??
      ""
    );
  }

  get eventsLabelSingular(): string {
    return (
      this.supervisionStore.metricConfigsById?.get(this.metricId)
        ?.eventNameSingular ?? ""
    );
  }

  get labels(): ConfigLabels {
    return this.supervisionStore.labels;
  }

  get isInsightsLanternState(): boolean {
    return this.supervisionStore.isInsightsLanternState;
  }

  get supervisionDetails(): SupervisionDetails | undefined {
    const metricEvents =
      this.supervisionStore.metricEventsByOfficerPseudoIdAndMetricId
        .get(this.officerPseudoId)
        ?.get(this.metricId);
    const clientEvent = metricEvents?.find(
      (e: SupervisionOfficerMetricEvent) => {
        return (
          e.pseudonymizedClientId === this.clientPseudoId &&
          // Only compare dates to the day granularity - since that is the
          // granularity of outcomeDate in the SupervisionStore
          moment(e.eventDate).isSame(moment(this.outcomeDate), "day")
        );
      },
    );

    if (!clientEvent) return undefined;

    return pick(
      ["officerAssignmentDate", "supervisionStartDate", "supervisionType"],
      clientEvent,
    );
  }

  trackViewed(): void {
    const { userPseudoId } =
      this.supervisionStore.insightsStore.rootStore.userStore;

    this.supervisionStore.insightsStore.rootStore.analyticsStore.trackInsightsClientPageViewed(
      {
        clientPseudonymizedId: this.clientPseudoId,
        outcomeDate: this.outcomeDate,
        viewedBy: userPseudoId,
      },
    );
  }
}
