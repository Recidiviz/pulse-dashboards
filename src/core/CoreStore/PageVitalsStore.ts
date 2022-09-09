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
import { when, makeAutoObservable, observable } from "mobx";
import type RootStore from ".";
import { formatISODateString, formatPercent } from "../../utils/formatStrings";
import {
  VitalsSummaryRecord,
  VitalsTimeSeriesRecord,
  ENTITY_TYPES,
} from "../models/types";
import {
  DownloadableData,
  DownloadableDataset,
  VitalsSummaryTableRow,
  METRIC_TYPE_LABELS,
  SummaryCard,
  METRIC_TYPES,
  SummaryStatus,
  MetricType,
  DEFAULT_ENTITY_ID,
} from "../PageVitals/types";

export function getSummaryStatus(value: number): SummaryStatus {
  if (value < 70) return "POOR";
  if (value >= 70 && value < 80) return "NEEDS_IMPROVEMENT";
  if (value >= 80 && value < 90) return "GOOD";
  if (value >= 90 && value < 95) return "GREAT";
  return "EXCELLENT";
}

export default class PageVitalsStore {
  protected readonly rootStore;

  currentEntityId: string;

  summaries: VitalsSummaryRecord[];

  timeSeries: VitalsTimeSeriesRecord[];

  selectedMetricId: MetricType;

  constructor({ rootStore }: { rootStore: RootStore }) {
    makeAutoObservable(this, {
      summaries: observable.ref,
      timeSeries: observable.ref,
    });
    this.rootStore = rootStore;
    this.currentEntityId = DEFAULT_ENTITY_ID;
    this.selectedMetricId = METRIC_TYPES.OVERALL;
    this.summaries = [];
    this.timeSeries = [];

    when(
      () => !this.rootStore.metricsStore.vitals.isLoading,
      () => {
        const { summaries, timeSeries } = this.rootStore.metricsStore.vitals;
        this.setSummaries(summaries);
        this.setTimeSeries(timeSeries);
      }
    );
  }

  setSummaries(summaries: VitalsSummaryRecord[]): void {
    this.summaries = summaries;
  }

  setTimeSeries(timeSeries: VitalsTimeSeriesRecord[]): void {
    this.timeSeries = timeSeries;
  }

  setSelectedMetricId(metricId: MetricType): void {
    this.selectedMetricId = metricId;
  }

  get currentEntitySummary(): VitalsSummaryRecord | undefined {
    return this.summaries.find((d) => d.entityId === this.currentEntityId);
  }

  get summaryCards(): SummaryCard[] {
    if (this.currentEntitySummary === undefined) return [];

    const summary = this.currentEntitySummary;
    return [
      {
        title: METRIC_TYPE_LABELS.OVERALL,
        description: "Average timeliness across all metrics",
        value: summary.overall,
        status: getSummaryStatus(summary.overall),
        id: METRIC_TYPES.OVERALL,
      },
      {
        title: METRIC_TYPE_LABELS.DISCHARGE,
        description: `of clients were discharged at their earliest projected regular
         supervision discharge date`,
        value: summary.timelyDischarge,
        status: getSummaryStatus(summary.timelyDischarge),
        id: METRIC_TYPES.DISCHARGE,
      },
      {
        title: METRIC_TYPE_LABELS.CONTACT,
        description: `of clients received initial contact within 30 days of starting
         supervision and a F2F contact every subsequent 90, 60, or 30 days for 
         minimum, medium, and maximum supervision levels respectively`,
        value: summary.timelyContact,
        status: getSummaryStatus(summary.timelyContact),
        id: METRIC_TYPES.CONTACT,
      },
      {
        title: METRIC_TYPE_LABELS.RISK_ASSESSMENT,
        description: `of clients have had an initial assessment within 30 days and 
          reassessment within 212 days`,
        value: summary.timelyRiskAssessment,
        status: getSummaryStatus(summary.timelyRiskAssessment),
        id: METRIC_TYPES.RISK_ASSESSMENT,
      },
    ];
  }

  get childEntitySummaryRows(): VitalsSummaryTableRow[] {
    return this.summaries
      .filter(
        (d) =>
          d.parentEntityId === this.currentEntityId &&
          d.parentEntityId !== d.entityId
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
        (d) => d.entityId === this.currentEntitySummary?.parentEntityId
      )?.entityName || "Unknown"
    );
  }

  get selectedMetricTimeSeries(): VitalsTimeSeriesRecord[] | undefined {
    const selectedTimeSeries = this.currentEntityTimeSeries.filter(
      (d) => d.metric === this.selectedMetricId
    );
    return selectedTimeSeries.length > 0 ? selectedTimeSeries : undefined;
  }

  get currentEntityTimeSeries(): VitalsTimeSeriesRecord[] {
    const selectedTimeSeries = this.timeSeries.filter(
      (d) => d.entityId === this.currentEntityId
    );
    return selectedTimeSeries;
  }

  get lastUpdatedOn(): string {
    return this.selectedMetricTimeSeries
      ? formatISODateString(
          this.selectedMetricTimeSeries[
            this.selectedMetricTimeSeries.length - 1
          ].date
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
    Object.values(METRIC_TYPES).forEach((metricType: MetricType) => {
      const metricData = this.currentEntityTimeSeries.filter(
        (d: VitalsTimeSeriesRecord) => d.metric === metricType
      );
      labels = metricData.map((d) => d.date);
      ids = metricData.map((d) => d.entityId);
      const downloadableData = metricData.map((d: VitalsTimeSeriesRecord) => {
        return {
          Total: formatPercent(d.value),
          "30D average": formatPercent(d.monthlyAvg),
        };
      });
      datasets.push({
        data: downloadableData,
        label: METRIC_TYPE_LABELS[metricType],
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
        return {
          "Overall score": formatPercent(d.overall),
          "30D change": formatPercent(d.overall30Day),
          "90D change": formatPercent(d.overall90Day),
          [METRIC_TYPE_LABELS.DISCHARGE]: formatPercent(d.timelyDischarge),
          [METRIC_TYPE_LABELS.CONTACT]: formatPercent(d.timelyContact),
          [METRIC_TYPE_LABELS.RISK_ASSESSMENT]: formatPercent(
            d.timelyRiskAssessment
          ),
        };
      }
    );

    datasets.push({ data: downloadableData, label: "" });

    return {
      chartDatasets: datasets,
      chartLabels: ids,
      chartId: `MetricsBy${dataExportLabel}`,
      dataExportLabel,
    };
  }

  get monthlyChange():
    | { thirtyDayChange: number; ninetyDayChange: number }
    | undefined {
    const timeSeries = this.selectedMetricTimeSeries;
    if (timeSeries === undefined) return undefined;

    const ninetyDaysAgo = timeSeries[timeSeries.length - 89];
    const thirtyDaysAgo = timeSeries[timeSeries.length - 29];
    const latestDay = timeSeries[timeSeries.length - 1];
    const thirtyDayChange = latestDay.monthlyAvg - thirtyDaysAgo.monthlyAvg;
    const ninetyDayChange = latestDay.monthlyAvg - ninetyDaysAgo.monthlyAvg;
    return { thirtyDayChange, ninetyDayChange };
  }

  get summaryDetail(): SummaryCard {
    return (
      this.summaryCards.find((card) => card.id === this.selectedMetricId) ||
      this.summaryCards[0]
    );
  }
}
