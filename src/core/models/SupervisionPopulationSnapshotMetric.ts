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

import { toTitleCase } from "../../utils";
import { downloadChartAsData } from "../../utils/downloads/downloadData";
import { DownloadableData, DownloadableDataset } from "../PagePractices/types";
import { PopulationFilterLabels } from "../types/filters";
import PathwaysMetric, { BaseMetricConstructorOptions } from "./PathwaysMetric";
import { SupervisionPopulationSnapshotRecord } from "./types";

export default class SupervisionPopulationSnapshotMetric extends PathwaysMetric<SupervisionPopulationSnapshotRecord> {
  accessor: keyof SupervisionPopulationSnapshotRecord;

  constructor(
    props: BaseMetricConstructorOptions<SupervisionPopulationSnapshotRecord> & {
      accessor: keyof SupervisionPopulationSnapshotRecord;
    }
  ) {
    super(props);
    this.accessor = props.accessor;
    this.download = this.download.bind(this);
  }

  get dataSeries(): SupervisionPopulationSnapshotRecord[] {
    if (!this.rootStore || !this.allRecords?.length) return [];
    const {
      gender,
      supervisionType,
      ageGroup,
      district,
      numberOfViolations,
      mostSevereViolation,
      supervisionLevel,
    } = this.rootStore.filtersStore.filters;

    const filteredRecords = this.allRecords.filter(
      (record: SupervisionPopulationSnapshotRecord) => {
        return (
          gender.includes(record.gender) &&
          ageGroup.includes(record.ageGroup) &&
          supervisionType.includes(record.supervisionType) &&
          (this.accessor === "district"
            ? !["ALL"].includes(record.district)
            : district.includes(record.district)) &&
          (this.accessor === "mostSevereViolation"
            ? !["ALL"].includes(record.mostSevereViolation)
            : mostSevereViolation.includes(record.mostSevereViolation)) &&
          (this.accessor === "numberOfViolations"
            ? !["ALL"].includes(record.numberOfViolations)
            : numberOfViolations.includes(record.numberOfViolations)) &&
          (this.accessor === "lengthOfStay"
            ? !["ALL"].includes(record.lengthOfStay)
            : ["ALL"].includes(record.lengthOfStay)) &&
          (this.accessor === "supervisionLevel"
            ? !["ALL"].includes(record.supervisionLevel)
            : supervisionLevel.includes(record.supervisionLevel)) &&
          ["ALL"].includes(record.race)
        );
      }
    );

    const result = pipe(
      groupBy((d: SupervisionPopulationSnapshotRecord) => [d[this.accessor]]),
      values,
      map((dataset) => ({
        count: sumBy("count", dataset),
        totalPopulation: sumBy("totalPopulation", dataset),
        populationProportion: (
          (sumBy("count", dataset) * 100) /
          sumBy("totalPopulation", dataset)
        ).toFixed(),
        lastUpdated: dataset[0].lastUpdated,
        gender: dataset[0].gender,
        district: dataset[0].district,
        supervisionType: dataset[0].supervisionType,
        ageGroup: dataset[0].ageGroup,
        mostSevereViolation: dataset[0].mostSevereViolation,
        numberOfViolations: dataset[0].numberOfViolations,
        lengthOfStay: dataset[0].lengthOfStay,
        supervisionLevel: dataset[0].supervisionLevel,
        race: dataset[0].race,
      }))
    )(filteredRecords);
    return result as SupervisionPopulationSnapshotRecord[];
  }

  get downloadableData(): DownloadableData | undefined {
    if (!this.dataSeries) return undefined;

    const datasets = [] as DownloadableDataset[];
    const data: Record<string, number>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((d: SupervisionPopulationSnapshotRecord) => {
      data.push({
        Count: Math.round(d.count),
      });

      if (this.rootStore?.filtersStore) {
        labels.push(
          this.rootStore?.filtersStore.getFilterLabel(
            this.accessor as keyof PopulationFilterLabels,
            d[this.accessor].toString()
          )
        );
      }
    });

    datasets.push({ data, label: "" });
    return {
      chartDatasets: datasets,
      chartLabels: labels,
      chartId: this.chartTitle,
      dataExportLabel: toTitleCase(this.accessor),
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
