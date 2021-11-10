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

import { pipe } from "lodash/fp";
import groupBy from "lodash/fp/groupBy";
import map from "lodash/fp/map";
import sumBy from "lodash/fp/sumBy";
import values from "lodash/fp/values";

import RootStore from "../../RootStore";
import { formatDate } from "../../utils";
import { downloadChartAsData } from "../../utils/downloads/downloadData";
import { DownloadableData, DownloadableDataset } from "../PagePractices/types";
import {
  formatMonthAndYear,
  MonthOptions,
} from "../PopulationTimeSeriesChart/helpers";
import PathwaysMetric, { BaseMetricConstructorOptions } from "./PathwaysMetric";
import { PopulationTimeSeriesRecord, SimulationCompartment } from "./types";
import { getRecordDate } from "./utils";

export default class PopulationOverTimeMetric extends PathwaysMetric<PopulationTimeSeriesRecord> {
  compartment: SimulationCompartment;

  constructor(
    props: BaseMetricConstructorOptions<PopulationTimeSeriesRecord> & {
      compartment: SimulationCompartment;
    }
  ) {
    super(props);
    this.compartment = props.compartment;
    this.download = this.download.bind(this);
  }

  get dataSeries(): PopulationTimeSeriesRecord[] {
    if (!this.rootStore || !this.allRecords?.length) return [];
    const {
      gender,
      supervisionType,
      legalStatus,
      timePeriod,
      facility,
      age,
    } = this.rootStore.filtersStore.filters;
    const monthRange: MonthOptions = parseInt(timePeriod) as MonthOptions;
    const status =
      this.compartment === "SUPERVISION" ? supervisionType : legalStatus;
    const stepSize = monthRange === 60 ? 2 : 1;

    const { mostRecentDate } = this;
    const filteredRecords = this.allRecords.filter(
      (record: PopulationTimeSeriesRecord) => {
        const monthsOut =
          (record.year - mostRecentDate.getFullYear()) * 12 +
          (record.month - (mostRecentDate.getMonth() + 1));
        return (
          record.gender === gender &&
          status.includes(record.legalStatus) &&
          age.includes(record.age) &&
          facility.includes(record.facility) &&
          Math.abs(monthsOut) <= monthRange &&
          monthsOut % stepSize === 0
        );
      }
    );

    const result = pipe(
      groupBy((d: PopulationTimeSeriesRecord) => [d.year, d.month]),
      values,
      map((dataset) => ({
        year: dataset[0].year,
        month: dataset[0].month,
        gender: dataset[0].gender,
        legalStatus: dataset[0].legalStatus,
        totalPopulation: sumBy("totalPopulation", dataset),
      }))
    )(filteredRecords);
    return result as PopulationTimeSeriesRecord[];
  }

  get mostRecentDate(): Date {
    const { allRecords } = this;

    if (!allRecords || allRecords.length === 0) {
      return new Date(9999, 11, 31);
    }

    return getRecordDate(allRecords.slice(-1)[0]);
  }

  get downloadableData(): DownloadableData | undefined {
    if (!this.dataSeries) return undefined;

    const datasets = [] as DownloadableDataset[];
    const data: Record<string, number>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((d: PopulationTimeSeriesRecord) => {
      data.push({
        Population: Math.round(d.totalPopulation),
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
      lastUpdatedOn: formatDate(this.mostRecentDate),
      methodologyContent: this.methodology,
      methodologyPDF: await this.fetchMethodologyPDF(),
    });
  }
}
