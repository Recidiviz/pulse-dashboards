/* eslint-disable class-methods-use-this */
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

import { MetricBenchmark } from "../models/MetricBenchmark";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import type { OutliersStore } from "../OutliersStore";
import { OutliersAPI } from "./interface";

export class OutliersOfflineAPIClient implements OutliersAPI {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly outliersStore: OutliersStore) {}

  async init() {
    const config = (
      await import("../models/offlineFixtures/OutliersConfigFixture")
    ).OutliersConfigFixture;

    return config;
  }

  async metricBenchmarks(): Promise<MetricBenchmark[]> {
    const { metricBenchmarksFixture } = await import(
      "../models/offlineFixtures/MetricBenchmarkFixture"
    );
    return metricBenchmarksFixture;
  }

  async supervisionOfficerSupervisors(): Promise<
    SupervisionOfficerSupervisor[]
  > {
    const { supervisionOfficerSupervisorsFixture } = await import(
      "../models/offlineFixtures/SupervisionOfficerSupervisor"
    );
    return supervisionOfficerSupervisorsFixture;
  }

  async officersForSupervisor(
    supervisorId: string
  ): Promise<Array<SupervisionOfficer>> {
    const { supervisionOfficerFixture } = await import(
      "../models/offlineFixtures/SupervisionOfficerFixture"
    );

    return supervisionOfficerFixture.filter(
      (o) => o.supervisorExternalId === supervisorId
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
