// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import RootStore from "../../RootStore";
import { formatDate } from "../../utils";
import { downloadChartAsData } from "../../utils/downloads/downloadData";
import { DownloadableData, DownloadableDataset } from "../PagePractices/types";
import { formatMonthAndYear } from "../PopulationTimeSeriesChart/helpers";
import PathwaysMetric, { BaseMetricConstructorOptions } from "./PathwaysMetric";
import {
  PopulationProjectionTimeSeriesRecord,
  SimulationCompartment,
} from "./types";
import { filterRecordByDimensions, getRecordDate } from "./utils";

export default class PopulationProjectionOverTimeMetric extends PathwaysMetric<PopulationProjectionTimeSeriesRecord> {
  compartment: SimulationCompartment;

  constructor(
    props: BaseMetricConstructorOptions<PopulationProjectionTimeSeriesRecord> & {
      compartment: SimulationCompartment;
    }
  ) {
    super(props);
    this.compartment = props.compartment;
    this.download = this.download.bind(this);
  }

  get dataSeries(): PopulationProjectionTimeSeriesRecord[] {
    if (!this.rootStore || !this.allRecords?.length) return [];
    const { filters } = this.rootStore.filtersStore;
    const { supervisionType, legalStatus } = filters;
    const { monthRange } = this.rootStore.filtersStore;
    const stepSize = monthRange === 60 ? 2 : 1;
    const status =
      this.compartment === "SUPERVISION" ? supervisionType : legalStatus;
    const { simulationDate } = this;

    return this.allRecords.filter(
      (record: PopulationProjectionTimeSeriesRecord) => {
        const monthsOut =
          (record.year - simulationDate.getFullYear()) * 12 +
          (record.month - (simulationDate.getMonth() + 1));
        return (
          Math.abs(monthsOut) <= monthRange &&
          monthsOut % stepSize === 0 &&
          status.includes(record.legalStatus) &&
          filterRecordByDimensions(record, this.dimensions, filters)
        );
      }
    );
  }

  get note(): string {
    return `${this.content.note} ${formatDate(
      this.simulationDate,
      "MMMM yyyy"
    )}.`;
  }

  get simulationDate(): Date {
    const { allRecords } = this;

    if (!allRecords || allRecords.length === 0) {
      return new Date(9999, 11, 31);
    }

    return getRecordDate(
      allRecords.filter((d) => d.simulationTag === "HISTORICAL").slice(-1)[0]
    );
  }

  get downloadableData(): DownloadableData | undefined {
    if (!this.dataSeries) return undefined;

    const datasets = [] as DownloadableDataset[];
    const data: Record<string, number>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((d: PopulationProjectionTimeSeriesRecord) => {
      data.push({
        Population: Math.round(d.totalPopulation),
        "CI Lower": Math.round(d.totalPopulationMin),
        "CI Upper": Math.round(d.totalPopulationMax),
      });

      labels.push(formatMonthAndYear(getRecordDate(d)));
    });

    datasets.push({ data, label: "" });

    return {
      chartDatasets: datasets,
      chartLabels: labels,
      chartId: this.chartTitle,
      dataExportLabel: "Month",
    };
  }

  async fetchMethodologyPDF(): Promise<Record<string, any>> {
    const token = await RootStore.getTokenSilently();
    const endpoint = `${
      process.env.REACT_APP_API_URL
    }/api/${this.rootStore?.currentTenantId?.toLowerCase()}/projections/methodology.pdf`;
    const pdf = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return {
      data: await pdf.blob(),
      type: "binary",
      name: "population_projections_methodology.pdf",
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
      lastUpdatedOn: formatDate(this.simulationDate),
      methodologyContent: this.methodology,
      methodologyPDF: await this.fetchMethodologyPDF(),
    });
  }
}
