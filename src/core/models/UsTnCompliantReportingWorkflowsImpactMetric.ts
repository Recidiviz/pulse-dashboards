/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
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

import { computed, makeObservable } from "mobx";

import ImpactMetric, { ImpactMetricConstructorOptions } from "./ImpactMetric";
import { UsTnCompliantReportingWorkflowsImpactRecord } from "./types";

interface DataItem {
  months: number;
  value: number;
  district?: string;
}

export default class UsTnCompliantReportingWorkflowsImpactMetric extends ImpactMetric<UsTnCompliantReportingWorkflowsImpactRecord> {
  constructor(props: ImpactMetricConstructorOptions) {
    super(props);
    makeObservable<UsTnCompliantReportingWorkflowsImpactMetric>(this, {
      dataSeries: computed,
      startDate: computed,
      avgPopulationLineData: computed,
      avgPopulationCompliantReportingLineData: computed,
      useAvgDailyPopulationData: computed,
      useValidTreatmentEffect: computed,
      useValidYExtent: computed,
    });
  }

  get dataSeries(): UsTnCompliantReportingWorkflowsImpactRecord[] {
    return this.allRecords ?? [];
  }

  // eslint-disable-next-line class-methods-use-this
  aggregatedChartData(data: DataItem[]): DataItem[] {
    const aggregatedData: DataItem[] = Object.entries(
      data.reduce((total, d) => {
        const updatedTotal = { ...total };
        if (!updatedTotal[d.months]) {
          updatedTotal[d.months] = d.value;
        } else {
          updatedTotal[d.months] += d.value;
        }
        return updatedTotal;
      }, {} as { [months: number]: number })
    )
      .map(([months, value]) => ({ months: Number(months), value }))
      .sort((a, b) => a.months - b.months);

    return aggregatedData;
  }

  get avgPopulationLineData(): DataItem[] {
    const data = this.dataSeries.map(
      (d: UsTnCompliantReportingWorkflowsImpactRecord) => ({
        months: d.monthsSinceTreatment,
        value: d.avgDailyPopulation,
      })
    );

    return this.aggregatedChartData(data);
  }

  get avgPopulationCompliantReportingLineData(): DataItem[] {
    const data = this.dataSeries.map(
      (d: UsTnCompliantReportingWorkflowsImpactRecord) => ({
        months: d.monthsSinceTreatment,
        value: d.avgPopulationLimitedSupervisionLevel,
      })
    );

    return this.aggregatedChartData(data);
  }

  get useAvgDailyPopulationData(): DataItem[] {
    const currentSection = this.rootStore.section;

    if (currentSection === "avgDailyPopulation") {
      return this.avgPopulationLineData;
    }
    if (currentSection === "avgPopulationCompliantReporting") {
      return this.avgPopulationCompliantReportingLineData;
    }

    return [{ months: 0, value: 0 }];
  }

  // eslint-disable-next-line class-methods-use-this
  yAxisBounds(chartData: DataItem[], roundToNearest: number): number[] {
    const maxDataValue = Math.max(...chartData.map((item) => item.value));

    const minDataValue = Math.min(...chartData.map((item) => item.value));

    const minRoundedValue =
      Math.round(minDataValue / roundToNearest) * roundToNearest;

    const maxRoundedValue =
      Math.round(maxDataValue / roundToNearest) * roundToNearest;

    return [minRoundedValue, maxRoundedValue];
  }

  get avgDailyPopulationYAxisBounds(): number[] {
    // TODO: replace these with getChartTop / getChartBottom in src/core/PopulationTimeSeriesChart/helpers.ts
    // set to round to the nearest two-thousand to display data at a closer level of granularity
    return this.yAxisBounds(this.avgPopulationLineData, 2000);
  }

  get avgPopulationCompliantReportingYAxisBounds(): number[] {
    // set to round to the nearest multiple of 800 to avoid the y axis points bleeding to the top/bottom of chart
    return this.yAxisBounds(this.avgPopulationCompliantReportingLineData, 800);
  }

  get useValidYExtent(): number[] {
    const currentSection = this.rootStore.section;

    if (currentSection === "avgDailyPopulation") {
      return this.avgDailyPopulationYAxisBounds;
    }
    if (currentSection === "avgPopulationCompliantReporting") {
      return this.avgPopulationCompliantReportingYAxisBounds;
    }
    return [];
  }

  get avgDailyPopulationTreatment(): number {
    return this.calculateTreatmentEffect(
      "monthsSinceTreatment",
      "avgDailyPopulation",
      "supervisionDistrict"
    );
  }

  get avgPopulationCompliantReportingTreatment(): number {
    return this.calculateTreatmentEffect(
      "monthsSinceTreatment",
      "avgPopulationLimitedSupervisionLevel",
      "supervisionDistrict"
    );
  }

  get useValidTreatmentEffect(): number {
    const currentSection = this.rootStore.section;

    if (currentSection === "avgDailyPopulation") {
      return this.avgDailyPopulationTreatment;
    }
    if (currentSection === "avgPopulationCompliantReporting") {
      return this.avgPopulationCompliantReportingTreatment;
    }

    return 0;
  }

  get startDate(): string {
    const data = this.dataSeries
      .map((d: any) => ({
        months: d.monthsSinceTreatment,
        startDate: d.startDate,
      }))
      .find((d) => d.months === 0);

    return data?.startDate ?? "";
  }
}
