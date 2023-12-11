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
import { pick } from "lodash/fp";
import { flowResult, makeAutoObservable } from "mobx";
import moment from "moment";

import { Hydratable } from "../../core/models/types";
import { castToError } from "../../utils/castToError";
import { ClientEvent } from "../models/ClientEvent";
import { ClientInfo } from "../models/ClientInfo";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import { OutliersSupervisionStore } from "../stores/OutliersSupervisionStore";
import { SupervisionDetails } from "./types";

export class SupervisionClientDetailPresenter implements Hydratable {
  error?: Error | undefined;

  isLoading?: boolean;

  constructor(
    private supervisionStore: OutliersSupervisionStore,
    public officerPseudoId: string,
    public clientPseudoId: string,
    public metricId: string,
    public outcomeDate: Date
  ) {
    makeAutoObservable(this);
  }

  get isHydrated(): boolean {
    return this.areEventsHydrated && this.isProfileInfoHydrated;
  }

  private get areEventsHydrated(): boolean {
    return this.clientEvents !== undefined;
  }

  private get isProfileInfoHydrated() {
    return this.clientInfo !== undefined;
  }

  /**
   * Initiates hydration for all data needed within this presenter class
   */
  async hydrate(): Promise<void> {
    if (this.isHydrated) return;

    this.setIsLoading(true);
    this.setError(undefined);

    try {
      await Promise.all([
        flowResult(
          this.supervisionStore.hydrateClientEventsForClient(
            this.clientPseudoId,
            this.outcomeDate
          )
        ),
        flowResult(
          this.supervisionStore.hydrateClientInfoForClient(this.clientPseudoId)
        ),
        flowResult(
          this.supervisionStore.hydrateMetricEventsForOfficer(
            this.officerPseudoId,
            this.metricId
          )
        ),
        flowResult(this.supervisionStore.hydrateMetricConfigs()),
      ]);
      this.setIsLoading(false);
    } catch (e) {
      this.setError(castToError(e));
      this.setIsLoading(false);
    }
  }

  setError(error: Error | undefined) {
    this.error = error;
  }

  setIsLoading(loadingValue: boolean) {
    this.isLoading = loadingValue;
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
      this.clientPseudoId
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
      }
    );

    if (!clientEvent) return undefined;

    return pick(
      ["officerAssignmentDate", "supervisionStartDate", "supervisionType"],
      clientEvent
    );
  }

  trackViewed(): void {
    const { userPseudoId } =
      this.supervisionStore.outliersStore.rootStore.userStore;

    this.supervisionStore.outliersStore.rootStore.analyticsStore.trackOutliersClientPageViewed(
      {
        clientPseudonymizedId: this.clientPseudoId,
        outcomeDate: this.outcomeDate,
        viewedBy: userPseudoId,
      }
    );
  }
}
