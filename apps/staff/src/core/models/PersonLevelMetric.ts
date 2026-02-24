// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { computed, makeObservable } from "mobx";

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import {
  DownloadableData,
  DownloadableDataset,
  PersonLevelDataRecord,
  PersonLevelMetric as SharedPersonLevelMetric,
  PopulationFilterLabels,
} from "~shared-pathways";

import { TENANT_CONFIGS } from "../../tenants";
import { toHumanReadable, toTitleCase } from "../../utils";
import { downloadChartAsData } from "../../utils/downloads/downloadData";
import CoreStore from "../CoreStore";
import { TableColumn } from "../types/charts";
import {
  BaseNewMetricConstructorProps,
  generateStaffNewMetricOptions,
} from "./generateStaffNewMetricOptions";

export default class PersonLevelMetric extends SharedPersonLevelMetric {
  readonly rootStore: CoreStore;

  constructor(props: BaseNewMetricConstructorProps) {
    super(generateStaffNewMetricOptions(props));
    this.rootStore = props.rootStore;

    makeObservable<PersonLevelMetric>(this, {
      downloadableData: computed,
    });

    this.download = this.download.bind(this);
  }

  override get tenantId(): string | undefined {
    return isOfflineMode() || isDemoMode()
      ? undefined
      : this.store.currentTenantId;
  }

  get columns(): TableColumn[] | undefined {
    if (!this.rootStore?.currentTenantId) return undefined;
    return TENANT_CONFIGS[this.rootStore.currentTenantId].tableColumns?.[
      this.id
    ];
  }

  get downloadableData(): DownloadableData | undefined {
    if (!this.dataSeries || !this.columns) return undefined;
    const { columns } = this;

    const datasets = [] as DownloadableDataset[];
    const data: Record<string, string>[] = [];
    const labels: string[] = [];

    this.dataSeries.forEach((d: PersonLevelDataRecord) => {
      const row: Record<string, any> = {};
      columns.forEach((c) => {
        if (c.Header === "Name") return;
        const value = d[c.accessor as keyof PersonLevelDataRecord];
        if (value) {
          if (c.useFilterLabels) {
            row[c.Header] = this.rootStore?.filtersStore.getFilterLabel(
              c.accessor as keyof PopulationFilterLabels,
              value.toString(),
            );
          } else if (c.useTitleCase) {
            row[c.Header] = toTitleCase(toHumanReadable(value.toString()));
          } else {
            row[c.Header] = value;
          }
        }
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
