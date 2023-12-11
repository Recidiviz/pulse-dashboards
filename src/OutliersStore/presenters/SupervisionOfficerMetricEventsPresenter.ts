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

import { Hydratable } from "../../core/models/types";
import { outliersUrl } from "../../core/views";
import { formatDateToISO } from "../../utils";
import { castToError } from "../../utils/castToError";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import { OutliersSupervisionStore } from "../stores/OutliersSupervisionStore";

export class SupervisionOfficerMetricEventsPresenter implements Hydratable {
  error?: Error | undefined;

  isLoading?: boolean;

  constructor(
    private supervisionStore: OutliersSupervisionStore,
    public officerPseudoId: string,
    public metricId: string
  ) {
    makeAutoObservable(this);
  }

  get isHydrated(): boolean {
    return this.areEventsHydrated && this.areMetricConfigsHydrated;
  }

  private get areEventsHydrated(): boolean {
    return (
      this.supervisionStore.metricEventsByOfficerPseudoIdAndMetricId
        .get(this.officerPseudoId)
        ?.has(this.metricId) ?? false
    );
  }

  private get areMetricConfigsHydrated() {
    return this.supervisionStore.metricConfigsById !== undefined;
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

  get officerMetricEvents(): Array<SupervisionOfficerMetricEvent> {
    return [
      ...(this.supervisionStore.metricEventsByOfficerPseudoIdAndMetricId
        .get(this.officerPseudoId)
        ?.get(this.metricId) ?? []),
    ].sort((a, b) => descending(a.eventDate, b.eventDate));
  }

  get eventsLabel() {
    return (
      this.supervisionStore.metricConfigsById?.get(this.metricId)?.eventName ??
      ""
    );
  }

  get clientPseudoId() {
    return this.supervisionStore.clientPseudoId;
  }

  get clientDetailLinks(): Array<string> | undefined {
    const { outliersClientDetail } =
      this.supervisionStore.outliersStore.rootStore.userStore
        .activeFeatureVariants;

    if (!outliersClientDetail) return;

    return Array.from(this.officerMetricEvents, (d) =>
      outliersUrl("supervisionClientDetail", {
        officerPseudoId: this.officerPseudoId,
        metricId: this.metricId,
        clientPseudoId: d.pseudonymizedClientId,
        outcomeDate: formatDateToISO(d.eventDate),
      })
    );
  }
}
