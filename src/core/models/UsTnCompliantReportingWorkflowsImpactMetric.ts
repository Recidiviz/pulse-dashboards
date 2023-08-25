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
      avgPopulationLineData: computed,
      startDate: computed,
      useAvgDailyPopulationData: computed,
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
    const data = this.dataSeries.map((d: any) => ({
      months: d.monthsSinceTreatment,
      value: d.avgDailyPopulation,
    }));

    return this.aggregatedChartData(data);
  }

  get useAvgDailyPopulationData(): DataItem[] {
    const currentSection = this.rootStore.section;
    if (currentSection === "avgDailyPopulation") {
      return this.avgPopulationLineData;
    }

    return [{ months: 0, value: 0 }];
  }

  get avgDailyPopulationTreatment(): number {
    return this.calculateTreatmentEffect(
      "monthsSinceTreatment",
      "avgDailyPopulation",
      "supervisionDistrict"
    );
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
