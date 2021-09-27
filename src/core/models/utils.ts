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

import {
  Gender,
  PopulationProjectionTimeSeriesRecord,
  RawMetricData,
  SimulationCompartment,
  SupervisionCountTimeSeriesRecord,
  SupervisionType,
} from "./types";

export function createProjectionTimeSeries(
  rawRecords: RawMetricData
): PopulationProjectionTimeSeriesRecord[] {
  return rawRecords.map((record) => {
    return {
      year: Number(record.year),
      month: Number(record.month),
      compartment: record.compartment as SimulationCompartment,
      legalStatus: record.legal_status,
      gender: record.gender as Gender,
      simulationTag: record.simulation_tag,
      totalPopulation: Number(record.total_population),
      totalPopulationMax: Number(record.total_population_max),
      totalPopulationMin: Number(record.total_population_min),
    };
  });
}

export function createSupervisionTransitionTimeSeries(
  rawRecords: RawMetricData,
  countField: string
): SupervisionCountTimeSeriesRecord[] {
  return rawRecords
    .map((record) => {
      return {
        year: Number(record.year),
        month: Number(record.month),
        gender: record.gender as Gender,
        supervisionType: record.supervision_type as SupervisionType,
        count: parseInt(record[countField]),
        avg90day: parseInt(record.avg_90day),
      };
    })
    .sort((a, b) => (a.year - b.year) * 12 + a.month - b.month);
}

export interface TimeSeriesRecord {
  month: number;
  year: number;
}

export function getRecordDate(d: TimeSeriesRecord): Date {
  return new Date(d.year, d.month - 1);
}