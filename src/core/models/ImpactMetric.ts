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

import {
  action,
  comparer,
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from "mobx";

import { callNewMetricsApi } from "../../api/metrics/metricsClient";
import RootStore from "../../RootStore";
import { TenantId } from "../../RootStore/types";
import { castToError } from "../../utils/castToError";
import { isDemoMode } from "../../utils/isDemoMode";
import { isOfflineMode } from "../../utils/isOfflineMode";
import ImpactStore from "../ImpactStore";
import { isAbortException } from "../utils/exceptions";
import {
  Hydratable,
  HydrationState,
  MetricRecord,
  NewBackendRecord,
} from "./types";

export type ImpactMetricConstructorOptions = {
  endpoint: string;
  rootStore: ImpactStore;
};

export default abstract class ImpactMetric<RecordFormat extends MetricRecord>
  implements Hydratable
{
  readonly endpoint: string;

  readonly rootStore: ImpactStore;

  hydrationState: HydrationState = { status: "needs hydration" };

  protected allRecords?: RecordFormat[];

  // this is just a noop stub method to be overridden when needed
  // eslint-disable-next-line class-methods-use-this
  protected dataTransformer: (d: RecordFormat[]) => RecordFormat[] = (
    d: RecordFormat[]
  ) => {
    return d;
  };

  protected abortController?: AbortController;

  constructor({ endpoint, rootStore }: ImpactMetricConstructorOptions) {
    this.endpoint = endpoint;
    this.rootStore = rootStore;

    makeObservable<ImpactMetric<RecordFormat>, "allRecords">(this, {
      allRecords: observable,
      records: computed,
      hydrate: action,
      hydrationState: observable,
    });

    reaction(
      () => {
        return this.rootStore.currentTenantId;
      },
      () => {
        // Don't rehydrate the metric if we are not currently viewing it. Instead, clear its
        // hydration status so that the loading bar is displayed the next time we navigate to it.
        // if (!this.isCurrentlyViewedMetric) {
        // }
        runInAction(() => {
          this.hydrationState = { status: "needs hydration" };
        });

        this.hydrate();
      },
      {
        // Use a structural comparison instead of the default '==='. This actually compares the
        // values of the filters, and ensures that if a user clicks on the filter value that's
        // already selected, we don't make another API call (because the comparer will return false,
        // so the reaction won't be entered).
        // This solves a different problem than the toJS call above! The above one solves the
        // problem where we always think things are equal because we aren't seeing changes to filter
        // values at all. This one solves the problem where we always think things are different
        // because two objects with all the same properties don't compare as equal with ===.
        equals: comparer.structural,
      }
    );
  }

  get tenantId(): TenantId | undefined {
    return isOfflineMode() || isDemoMode()
      ? undefined
      : this.rootStore.currentTenantId;
  }

  protected async fetchNewMetrics(
    params?: URLSearchParams
  ): Promise<NewBackendRecord<RecordFormat>> {
    // This could abort requests that have already completed, but that's not a big deal.
    this.abortController?.abort();
    this.abortController = new AbortController();

    const stateCode = isOfflineMode() || isDemoMode() ? "US_OZ" : this.tenantId;

    return callNewMetricsApi(
      `pathways/${stateCode}/${this.endpoint}?${params?.toString()}`,
      RootStore.getTokenSilently,
      this.abortController.signal
    );
  }

  /**
   * Fetches metric data and stores the result reactively on this Metric instance.
   */
  async hydrate(): Promise<void> {
    this.hydrationState = { status: "loading" };
    this.fetchNewMetrics()
      .then((fetchedData) => {
        runInAction(() => {
          this.allRecords = this.dataTransformer(fetchedData.data);
          this.hydrationState = { status: "hydrated" };
        });
      })
      .catch((e) => {
        // Just ignore abort exceptions because it means there is another request active.
        // This needs to be checked here rather than in fetchNewMetrics, otherwise the empty data
        // from the aborted request could override the actual data we want.
        if (!isAbortException(e)) {
          runInAction(() => {
            this.hydrationState = { status: "failed", error: castToError(e) };
          });
        }
      });
  }

  get records(): RecordFormat[] {
    return this.allRecords ?? [];
  }

  calculateTreatmentEffect(
    months: string,
    avgValue: string,
    supervisionDistrict: string
  ): number {
    const dataSeries = this.records;
    const data = dataSeries.map((d: any) => ({
      months: d[months],
      value: d[avgValue],
      district: d[supervisionDistrict],
    }));

    const beforeExperiment = data.reduce(
      (acc, d) => {
        if (d.months < 0) {
          acc.totalSum += d.value;
          acc.totalDistricts += 1;
        }
        return acc;
      },
      { totalSum: 0, totalDistricts: 0 }
    );

    const afterExperiment = data.reduce(
      (acc, d) => {
        if (d.months >= 0) {
          acc.totalSum += d.value;
          acc.totalDistricts += 1;
        }
        return acc;
      },
      { totalSum: 0, totalDistricts: 0 }
    );

    const averageBeforeExperiment =
      beforeExperiment.totalSum / beforeExperiment.totalDistricts;

    const averageAfterExperiment =
      afterExperiment.totalSum / afterExperiment.totalDistricts;

    const result = Math.round(averageAfterExperiment - averageBeforeExperiment);

    return result;
  }
}
