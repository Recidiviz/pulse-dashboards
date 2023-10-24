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

import { callNewMetricsApi } from "../../api/metrics/metricsClient";
import { MetricBenchmark } from "../models/MetricBenchmark";
import { outliersConfigSchema } from "../models/OutliersConfig";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import {
  SupervisionOfficerSupervisor,
  supervisionOfficerSupervisorSchema,
} from "../models/SupervisionOfficerSupervisor";
import type { OutliersStore } from "../OutliersStore";
import { OutliersAPI } from "./interface";

export class OutliersAPIClient implements OutliersAPI {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly outliersStore: OutliersStore) {}

  tenantId(): string {
    const { currentTenantId } = this.outliersStore.rootStore;
    if (!currentTenantId) {
      throw new Error(`Attempted to fetch data with undefined tenantId`);
    }
    return currentTenantId;
  }

  init() {
    const endpoint = `outliers/${this.tenantId()}/configuration`.toLowerCase();
    return callNewMetricsApi(
      endpoint,
      this.outliersStore.rootStore.getTokenSilently
    ).then((fetchedData) => {
      return outliersConfigSchema.parse(fetchedData.config);
    });
  }

  /* eslint-disable class-methods-use-this */
  async metricBenchmarks(): Promise<MetricBenchmark[]> {
    const { metricBenchmarksFixture } = await import(
      "../models/offlineFixtures/MetricBenchmarkFixture"
    );
    return metricBenchmarksFixture;
  }

  supervisionOfficerSupervisors(): Promise<SupervisionOfficerSupervisor[]> {
    const endpoint = `outliers/${this.tenantId()}/supervisors`.toLowerCase();
    return callNewMetricsApi(
      endpoint,
      this.outliersStore.rootStore.getTokenSilently
    ).then((fetchedData) => {
      const supervisorData = fetchedData.supervisors as Array<unknown>;
      return supervisorData.map((b) =>
        supervisionOfficerSupervisorSchema.parse(b)
      );
    });
  }

  /* eslint-disable class-methods-use-this */
  async officersForSupervisor(
    supervisorId: string
  ): Promise<Array<SupervisionOfficer>> {
    const { supervisionOfficerFixture } = await import(
      "../models/offlineFixtures/SupervisionOfficerFixture"
    );

    return supervisionOfficerFixture.filter(
      (o) => o.supervisorId === supervisorId
    );
  }

  async supervisionOfficer(officerId: string): Promise<SupervisionOfficer> {
    const { supervisionOfficerFixture } = await import(
      "../models/offlineFixtures/SupervisionOfficerFixture"
    );

    const officerFixture = supervisionOfficerFixture.find(
      (o) => o.externalId === officerId
    );

    if (!officerFixture)
      throw new Error(`Officer ${officerId} not present in fixture data`);

    return officerFixture;
  }

  async supervisionOfficerMetricEvents(
    officerId: string,
    metricId: string
  ): Promise<SupervisionOfficerMetricEvent[]> {
    const { supervisionOfficerMetricEventFixture } = await import(
      "../models/offlineFixtures/SupervisionOfficerMetricEventFixture"
    );
    return supervisionOfficerMetricEventFixture.filter(
      (e) => e.metricId === metricId
    );
  }
}
