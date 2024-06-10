// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { flowResult, makeAutoObservable } from "mobx";

import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { insightsUrl } from "../../core/views";
import { formatDateToISO } from "../../utils";
import { FAVORABLE_METRIC_IDS } from "../models/offlineFixtures/constants";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { ConfigLabels } from "./types";

export class SupervisionOfficerMetricEventsPresenter implements Hydratable {
  constructor(
    private supervisionStore: InsightsSupervisionStore,
    public officerPseudoId: string,
    public metricId: string,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        this.expectEventsPopulated,
        this.expectMetricConfigsPopulated,
      ],
      populate: async () => {
        await Promise.all([
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
    if (
      !(
        this.supervisionStore.metricEventsByOfficerPseudoIdAndMetricId
          .get(this.officerPseudoId)
          ?.has(this.metricId) ?? false
      )
    )
      throw new Error("Failed to populate metric events");
  }

  private expectMetricConfigsPopulated() {
    if (this.supervisionStore.metricConfigsById === undefined)
      throw new Error("Failed to populate metric configs");
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

  get officerMetricEvents(): Array<SupervisionOfficerMetricEvent> {
    return [
      ...(this.supervisionStore.metricEventsByOfficerPseudoIdAndMetricId
        .get(this.officerPseudoId)
        ?.get(this.metricId) ?? []),
      // TODO #5196 update model and/or API client to handle undefined eventDate for treatment_starts
    ].sort((a, b) =>
      descending(a.eventDate ?? undefined, b.eventDate ?? undefined),
    );
  }

  get eventsLabel() {
    return (
      this.supervisionStore.metricConfigsById?.get(this.metricId)?.eventName ??
      ""
    );
  }

  get labels(): ConfigLabels {
    return this.supervisionStore.labels;
  }

  get clientPseudoId() {
    return this.supervisionStore.clientPseudoId;
  }

  get clientDetailLinks(): Array<string> | undefined {
    const { insightsLanternState } =
      this.supervisionStore.insightsStore.rootStore.tenantStore;
    const hasUndefinedEventDates = this.officerMetricEvents.some(
      (e) => !e.eventDate,
    );

    if (!insightsLanternState || hasUndefinedEventDates) return;

    return Array.from(this.officerMetricEvents, (d) =>
      insightsUrl("supervisionClientDetail", {
        officerPseudoId: this.officerPseudoId,
        metricId: this.metricId,
        clientPseudoId: d.pseudonymizedClientId,
        // TODO 5196 update model and/or API client to handle undefined eventDate for treatment_starts
        // The undefined event date was handled above so this is safe for now
        // @ts-ignore
        outcomeDate: formatDateToISO(d.eventDate),
      }),
    );
  }

  get hideEventDateColumn(): boolean {
    return this.metricId === FAVORABLE_METRIC_IDS.enum.treatment_starts;
  }

  get supervisorHomepage(): boolean {
    return this.supervisionStore.insightsStore.shouldUseSupervisorHomepageUI;
  }
}
