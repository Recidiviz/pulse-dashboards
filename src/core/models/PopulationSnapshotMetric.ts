/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */
import { pipe } from "lodash/fp";
import groupBy from "lodash/fp/groupBy";
import map from "lodash/fp/map";
import sumBy from "lodash/fp/sumBy";
import values from "lodash/fp/values";

import { downloadChartAsData } from "../../utils/downloads/downloadData";
import { DownloadableData, DownloadableDataset } from "../PagePractices/types";
import PathwaysMetric, { BaseMetricConstructorOptions } from "./PathwaysMetric";
import { PopulationSnapshotRecord, SimulationCompartment } from "./types";

export default class PopulationSnapshotMetric extends PathwaysMetric<PopulationSnapshotRecord> {
  compartment: SimulationCompartment;

  constructor(
    props: BaseMetricConstructorOptions<PopulationSnapshotRecord> & {
      compartment: SimulationCompartment;
    }
  ) {
    super(props);
    this.compartment = props.compartment;
    this.download = this.download.bind(this);
  }

  get dataSeries(): PopulationSnapshotRecord[] {
    if (!this.rootStore || !this.allRecords?.length) return [];
    const {
      gender,
      legalStatus,
      supervisionType,
      ageGroup,
      facility,
    } = this.rootStore.filtersStore.filters;
    const status =
      this.compartment === "SUPERVISION" ? supervisionType : legalStatus;

    const filteredRecords = this.allRecords.filter(
      (record: PopulationSnapshotRecord) => {
        return (
          gender.includes(record.gender) &&
          status.includes(record.legalStatus) &&
          ageGroup.includes(record.ageGroup) &&
          (this.id === "prisonFacilityPopulation"
            ? !["ALL"].includes(record.facility)
            : facility.includes(record.facility))
        );
      }
    );

    const result = pipe(
      groupBy((d: PopulationSnapshotRecord) => [d.facility]),
      values,
      map((dataset) => ({
        gender: dataset[0].gender,
        legalStatus: dataset[0].legalStatus,
        facility: dataset[0].facility,
        lastUpdated: dataset[0].lastUpdated,
        ageGroup: dataset[0].ageGroup,
        totalPopulation: sumBy("totalPopulation", dataset),
      }))
    )(filteredRecords);
    return result as PopulationSnapshotRecord[];
  }

  get downloadableData(): DownloadableData | undefined {
    if (!this.dataSeries) return undefined;

    const datasets = [] as DownloadableDataset[];
    const data: Record<string, number>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((d: PopulationSnapshotRecord) => {
      data.push({
        Count: Math.round(d.totalPopulation),
      });

      labels.push(d.facility);
    });

    datasets.push({ data, label: "" });
    return {
      chartDatasets: datasets,
      chartLabels: labels,
      chartId: this.chartTitle,
      dataExportLabel: "Facility",
    };
  }

  async download(): Promise<void> {
    return downloadChartAsData({
      fileContents: [this.downloadableData],
      chartTitle: this.chartTitle,
      shouldZipDownload: true,
      getTokenSilently: this.rootStore?.userStore.getTokenSilently,
      includeFiltersDescriptionInCSV: true,
      filters: {
        filtersDescription: this.rootStore?.filtersStore.filtersDescription,
      },
      methodologyContent: this.methodology,
    });
  }
}
