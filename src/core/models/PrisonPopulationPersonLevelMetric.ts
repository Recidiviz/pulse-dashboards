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
import { groupBy, map, pipe, values } from "lodash/fp";
import { computed, makeObservable } from "mobx";

import tenants from "../../tenants";
import { toHumanReadable, toTitleCase } from "../../utils";
import { downloadChartAsData } from "../../utils/downloads/downloadData";
import { DownloadableData, DownloadableDataset } from "../PagePractices/types";
import { TableColumn } from "../types/charts";
import PathwaysMetric, { BaseMetricConstructorOptions } from "./PathwaysMetric";
import { PrisonPopulationPersonLevelRecord, TimePeriod } from "./types";
import { filterTimePeriod } from "./utils";

export default class PrisonPopulationPersonLevelMetric extends PathwaysMetric<PrisonPopulationPersonLevelRecord> {
  constructor(
    props: BaseMetricConstructorOptions<PrisonPopulationPersonLevelRecord>
  ) {
    super(props);

    makeObservable<PrisonPopulationPersonLevelMetric>(this, {
      dataSeries: computed,
      downloadableData: computed,
    });

    this.download = this.download.bind(this);
  }

  get dataSeries(): PrisonPopulationPersonLevelRecord[] {
    if (!this.rootStore || !this.allRecords?.length) return [];
    const {
      gender,
      ageGroup,
      facility,
      legalStatus,
      timePeriod,
    } = this.rootStore.filtersStore.filters;
    const handleFilters = (filter: string[] | string, recordValue: string) => {
      const filters = Array.isArray(filter) ? filter : [filter];

      if (filters.includes("ALL")) {
        return recordValue !== "ALL";
      }

      return filters.includes(recordValue);
    };

    const filteredRecords = this.allRecords.filter(
      (record: PrisonPopulationPersonLevelRecord) => {
        return (
          // #TODO #1596 create tooling to reduce listing every dimension in filters
          handleFilters(facility, record.facility) &&
          handleFilters(gender, record.gender) &&
          handleFilters(ageGroup, record.ageGroup) &&
          handleFilters(legalStatus, record.legalStatus) &&
          filterTimePeriod(
            this.hasTimePeriodDimension,
            record.timePeriod,
            timePeriod[0] as TimePeriod
          )
        );
      }
    );

    const result = pipe(
      groupBy((d: PrisonPopulationPersonLevelRecord) => [d.stateId]),
      values,
      map((dataset) => ({
        fullName: dataset[0].fullName,
        stateId: dataset[0].stateId,
        gender: dataset[0].gender,
        age: dataset
          .map((d: PrisonPopulationPersonLevelRecord) => d.age)
          .join(", "),
        facility: dataset
          .map((d: PrisonPopulationPersonLevelRecord) => d.facility)
          .join(", "),
        legalStatus: dataset[0].legalStatus,
        lastUpdated: dataset[0].lastUpdated,
        timePeriod: dataset[0].timePeriod,
        ageGroup: dataset[0].ageGroup,
      }))
    )(filteredRecords);

    return result as PrisonPopulationPersonLevelRecord[];
  }

  get columns(): TableColumn[] | undefined {
    if (!this.rootStore?.currentTenantId) return undefined;
    return tenants[this.rootStore.currentTenantId].tableColumns?.[this.id];
  }

  get downloadableData(): DownloadableData | undefined {
    if (!this.dataSeries || !this.columns) return undefined;
    const { columns } = this;

    const datasets = [] as DownloadableDataset[];
    const data: Record<string, string>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((d: PrisonPopulationPersonLevelRecord) => {
      const row: Record<string, any> = {};
      columns.forEach((c) => {
        if (c.Header === "Name") return;
        row[c.Header] = c.titleCase
          ? toTitleCase(
              toHumanReadable(
                d[
                  c.accessor as keyof PrisonPopulationPersonLevelRecord
                ].toString()
              )
            )
          : d[c.accessor as keyof PrisonPopulationPersonLevelRecord];
      });
      data.push(row);
      labels.push(d.fullName);
    });

    datasets.push({ data, label: "" });
    return {
      chartDatasets: datasets,
      chartLabels: labels,
      chartId: this.chartTitle,
      dataExportLabel: "Name",
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
