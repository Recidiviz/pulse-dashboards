// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { makeAutoObservable, reaction } from "mobx";

import { TENANT_CONFIGS } from "../../tenants";
import { downloadChartAsData } from "../../utils/downloads/downloadData";
import { formatISODateString, formatPercent } from "../../utils/formatStrings";
import { getMethodologyCopy } from "../content";
import {
  ENTITY_TYPES,
  VitalsSummaryRecord,
  VitalsTimeSeriesRecord,
} from "../models/types";
import {
  DEFAULT_ENTITY_ID,
  DownloadableData,
  DownloadableDataset,
  METRIC_TYPES,
  MetricType,
  SummaryCard,
  SummaryStatus,
  VitalsMetric,
  VitalsSummaryTableRow,
} from "../PageVitals/types";
import type RootStore from ".";

export function getSummaryStatus(value: number): SummaryStatus {
  if (value < 70) return "POOR";
  if (value >= 70 && value < 80) return "NEEDS_IMPROVEMENT";
  if (value >= 80 && value < 90) return "GOOD";
  if (value >= 90 && value < 95) return "GREAT";
  return "EXCELLENT";
}

export default class VitalsStore {
  protected readonly rootStore;

  selectedMetricId: MetricType;

  currentEntityId: string;

  constructor({ rootStore }: { rootStore: RootStore }) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
    this.currentEntityId = DEFAULT_ENTITY_ID;
    this.selectedMetricId = METRIC_TYPES.OVERALL;
    this.downloadData = this.downloadData.bind(this);
    reaction(
      () => this.rootStore.currentTenantId,
      () => this.setCurrentEntityId(DEFAULT_ENTITY_ID),
    );
  }

  setCurrentEntityId(entityId: string): void {
    this.currentEntityId = entityId;
  }

  resetCurrentEntityId(): void {
    this.setCurrentEntityId(METRIC_TYPES.OVERALL);
  }

  get summaries(): VitalsSummaryRecord[] {
    return this.rootStore.metricsStore.vitals.summaries;
  }

  get timeSeries(): VitalsTimeSeriesRecord[] {
    return this.rootStore.metricsStore.vitals.timeSeries;
  }

  setSelectedMetricId(metricId: MetricType): void {
    this.selectedMetricId = metricId || METRIC_TYPES.OVERALL;
  }

  get metrics(): VitalsMetric[] {
    const tenantId = this.rootStore.tenantStore.currentTenantId;
    if (!tenantId) return [] as VitalsMetric[];
    return TENANT_CONFIGS[tenantId].vitalsMetrics || ([] as VitalsMetric[]);
  }

  get currentEntitySummary(): VitalsSummaryRecord | undefined {
    return this.summaries.find((d) => d.entityId === this.currentEntityId);
  }

  get summaryCards(): SummaryCard[] {
    if (this.currentEntitySummary === undefined) return [] as SummaryCard[];

    const summary = this.currentEntitySummary;
    return this.metrics.map((m) => ({
      title: m.name,
      description: m.description,
      value: summary[m.accessor],
      status: getSummaryStatus(summary[m.accessor]),
      id: m.id,
    }));
  }

  get childEntitySummaryRows(): VitalsSummaryTableRow[] {
    return this.summaries
      .filter(
        (d) =>
          d.parentEntityId === this.currentEntityId &&
          d.parentEntityId !== d.entityId,
      )
      .map((d) => {
        const { entityId, entityName, entityType, ...attrs } = d;
        return {
          entity: {
            entityId,
            entityName,
            entityType,
          },
          ...attrs,
        };
      });
  }

  get parentEntityName(): string {
    return (
      this.summaries.find(
        (d) => d.entityId === this.currentEntitySummary?.parentEntityId,
      )?.entityName || "Unknown"
    );
  }

  get selectedMetricTimeSeries(): VitalsTimeSeriesRecord[] | undefined {
    const selectedTimeSeries = this.currentEntityTimeSeries.filter(
      (d) => d.metric === this.selectedMetricId,
    );
    return selectedTimeSeries.length > 0 ? selectedTimeSeries : undefined;
  }

  get currentEntityTimeSeries(): VitalsTimeSeriesRecord[] {
    const selectedTimeSeries = this.timeSeries.filter(
      (d) => d.entityId === this.currentEntityId,
    );
    return selectedTimeSeries.sort(
      (a: VitalsTimeSeriesRecord, b: VitalsTimeSeriesRecord) => {
        return +new Date(a.date) - +new Date(b.date);
      },
    );
  }

  get lastUpdatedOn(): string {
    return this.selectedMetricTimeSeries
      ? formatISODateString(
          this.selectedMetricTimeSeries[
            this.selectedMetricTimeSeries.length - 1
          ].date,
        )
      : "Unknown";
  }

  get filtersText(): string {
    let offices;
    let officers;
    if (this.currentEntitySummary === undefined) return "";

    switch (this.currentEntitySummary.entityType) {
      case ENTITY_TYPES.LEVEL_1_SUPERVISION_LOCATION:
        offices = this.currentEntitySummary.entityName;
        officers =
          this.childEntitySummaryRows &&
          this.childEntitySummaryRows
            .map((child) => child.entity.entityName)
            .join(", ");
        break;
      case ENTITY_TYPES.PO:
        offices = this.parentEntityName;
        officers = this.currentEntitySummary.entityName;
        break;
      default:
        offices = "All";
        officers = "All";
    }
    return `Office(s): ${offices}, Officers: ${officers}`;
  }

  get timeSeriesDownloadableData(): DownloadableData | undefined {
    if (!this.currentEntityTimeSeries) return undefined;

    let labels = [] as string[];
    let ids = [] as string[];
    const datasets = [] as DownloadableDataset[];
    this.metrics.forEach((metric) => {
      const metricData = this.currentEntityTimeSeries.filter(
        (d: VitalsTimeSeriesRecord) => d.metric === metric.id,
      );
      labels = metricData.map((d) => d.date);
      ids = metricData.map((d) => d.entityId);
      const downloadableData = metricData.map((d: VitalsTimeSeriesRecord) => {
        return {
          Total: formatPercent(d.value, true),
          "30D average": formatPercent(d.monthlyAvg, true),
        };
      });
      datasets.push({
        data: downloadableData,
        label: metric.name,
      });
    });

    // add IDs to the beginning of the dataset
    datasets.unshift({ data: ids, label: "Id" });

    return {
      chartDatasets: datasets,
      chartLabels: labels,
      chartId: "MetricsOverTime",
      dataExportLabel: "Date",
    };
  }

  get summaryDownloadableData(): DownloadableData | undefined {
    if (this.childEntitySummaryRows.length === 0) return undefined;

    const dataExportLabel =
      this.childEntitySummaryRows[0].entity.entityType.toLowerCase() ===
      ENTITY_TYPES.PO.toLowerCase()
        ? "Officer"
        : "Office";

    const ids = this.childEntitySummaryRows.map((d) => d.entity.entityName);
    const datasets = [] as DownloadableDataset[];

    const downloadableData = this.childEntitySummaryRows.map(
      (d: VitalsSummaryTableRow) => {
        const metrics = this.metrics.reduce((acc: any, metric) => {
          if (metric.id !== METRIC_TYPES.OVERALL) {
            acc[metric.name] = formatPercent(d[metric.accessor], true);
          }
          return acc;
        }, {});

        return {
          "Overall across all practices": formatPercent(d.overall, true),
          "30D change": formatPercent(d.overall30Day, true),
          "90D change": formatPercent(d.overall90Day, true),
          ...metrics,
        };
      },
    );

    datasets.push({ data: downloadableData, label: "" });

    return {
      chartDatasets: datasets,
      chartLabels: ids,
      chartId: `MetricsBy${dataExportLabel}`,
      dataExportLabel,
    };
  }

  get monthlyChange(): {
    thirtyDayChange?: number;
    ninetyDayChange?: number;
  } {
    const timeSeries = this.selectedMetricTimeSeries;
    if (timeSeries === undefined)
      return { thirtyDayChange: undefined, ninetyDayChange: undefined };
    const ninetyDaysAgo =
      timeSeries.length >= 91 ? timeSeries[timeSeries.length - 91] : undefined;
    const thirtyDaysAgo =
      timeSeries.length >= 31 ? timeSeries[timeSeries.length - 31] : undefined;
    const latestDay = timeSeries[timeSeries.length - 1];
    const thirtyDayChange = thirtyDaysAgo
      ? latestDay.value - thirtyDaysAgo.value
      : undefined;
    const ninetyDayChange = ninetyDaysAgo
      ? latestDay.value - ninetyDaysAgo.value
      : undefined;
    return { thirtyDayChange, ninetyDayChange };
  }

  get summaryDetail(): SummaryCard {
    return (
      this.summaryCards.find((card) => card.id === this.selectedMetricId) ||
      this.summaryCards[0]
    );
  }

  async downloadData(): Promise<void> {
    if (!this.rootStore.currentTenantId) return;
    const methodologyCopy = getMethodologyCopy(this.rootStore.currentTenantId);
    const methodology = methodologyCopy.operations;

    return downloadChartAsData({
      fileContents: [
        this.timeSeriesDownloadableData,
        this.summaryDownloadableData,
      ],
      chartTitle: `${this.rootStore.tenantStore.stateName} Practices`,
      shouldZipDownload: true,
      methodologyContent:
        methodology?.pageCopy && Object.values(methodology.pageCopy),
      getTokenSilently: this.rootStore.userStore.getTokenSilently,
      filters: this.filtersText,
      lastUpdatedOn: this.lastUpdatedOn,
    });
  }
}
