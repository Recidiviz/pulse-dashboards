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
  ExcludedSupervisionOfficer,
  SupervisionOfficer,
  SupervisionOfficerMetricEvent,
} from "~datatypes";
import { FlowMethod, Hydratable, HydratesFromSource } from "~hydration-utils";

import { InsightsAPI } from "../api/interface";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { ConfigLabels, SupervisionDetails } from "./types";

export class SupervisionClientDetailPresenter implements Hydratable {
  fetchedOfficerRecord?: SupervisionOfficer;

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
        this.expectOfficerHydrated,
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
          flowResult(this.populateSupervisionOfficer()),
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

  private expectOfficerHydrated() {
    if (!this.officerRecord) throw new Error("Failed to populate officer info");
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

  get clientEventTypes(): Set<string> {
    const { clientEvents } = this;

    return new Set(clientEvents?.map((event) => event["metricId"]));
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

  get clientMetricEvent(): SupervisionOfficerMetricEvent | undefined {
    const metricEvents =
      this.supervisionStore.metricEventsByOfficerPseudoIdAndMetricId
        .get(this.officerPseudoId)
        ?.get(this.metricId);
    const clientMetricEvent = metricEvents?.find(
      (e: SupervisionOfficerMetricEvent) => {
        return (
          e.pseudonymizedClientId === this.clientPseudoId &&
          // Only compare dates to the day granularity - since that is the
          // granularity of outcomeDate in the SupervisionStore
          moment(e.eventDate).isSame(moment(this.outcomeDate), "day")
        );
      },
    );

    return clientMetricEvent;
  }

  get supervisionDetails(): SupervisionDetails | undefined {
    const { clientMetricEvent } = this;

    if (!clientMetricEvent) return undefined;

    return pick(
      ["officerAssignmentDate", "supervisionStartDate", "supervisionType"],
      clientMetricEvent,
    );
  }

  get officerSurname(): string | undefined {
    return this.officerRecord?.fullName.surname;
  }

  get clientEventsWithSupervisionEvents(): ClientEvent[] | undefined {
    const {
      clientEvents,
      supervisionDetails,
      clientMetricEvent,
      officerSurname,
      labels: { supervisionOfficerLabel },
    } = this;

    let events = clientEvents ?? [];

    if (supervisionDetails) {
      const { supervisionType, ...relevantSupervisionDates } =
        supervisionDetails;

      const supervisionEventLabels: Record<
        keyof typeof relevantSupervisionDates,
        string
      > = {
        officerAssignmentDate: `assigned_to_${supervisionOfficerLabel}_${officerSurname ?? ""}`,
        supervisionStartDate: `${supervisionType}_start_date`,
      };

      const supervisionEvents = Object.entries(relevantSupervisionDates).map(
        ([key, value]): ClientEvent => {
          return {
            eventDate: value,
            metricId:
              supervisionEventLabels[
                key as keyof typeof relevantSupervisionDates
              ],
            attributes: {
              code: null,
              description: null,
            },
          };
        },
      );

      events = [...events, ...supervisionEvents];
    }

    if (clientMetricEvent) {
      const metricEvent: ClientEvent = {
        eventDate: clientMetricEvent.eventDate,
        metricId: `${this.eventsLabelSingular}_date`,
        attributes: {
          code: null,
          description: null,
        },
      };

      events = [...events, ...[metricEvent]];
    }

    return events
      ? events.sort((a, b) => descending(a.eventDate, b.eventDate))
      : undefined;
  }

  private get isOfficerPopulated(): boolean {
    return !!this.supervisionStore.officerRecord;
  }

  private get officerRecord():
    | SupervisionOfficer
    | ExcludedSupervisionOfficer
    | undefined {
    return this.supervisionStore.officerRecord ?? this.fetchedOfficerRecord;
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

  *populateSupervisionOfficer(): FlowMethod<
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
