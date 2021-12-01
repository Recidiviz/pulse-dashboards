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
  AgeGroup,
  Gender,
  PopulationProjectionTimeSeriesRecord,
  PrisonPopulationPersonLevelRecord,
  PrisonPopulationSnapshotRecord,
  PrisonPopulationTimeSeriesRecord,
  RawMetricData,
  SimulationCompartment,
  SupervisionPopulationSnapshotRecord,
  SupervisionPopulationTimeSeriesRecord,
  SupervisionType,
} from "./types";

const supervisionDimensionDefaults = {
  supervisionType: "ALL" as SupervisionType,
  gender: "ALL" as Gender,
  ageGroup: "ALL" as AgeGroup,
  district: "ALL",
  mostSevereViolation: "ALL",
  numberOfViolations: "ALL",
};

const prisonDimensionDefaults = {
  legalStatus: "ALL",
  gender: "ALL" as Gender,
  ageGroup: "ALL" as AgeGroup,
  facility: "ALL",
};

const mergeDefaults = (record: any, defaults: any) =>
  Object.assign(
    {},
    defaults,
    ...Object.entries(record).map(([k, v]) =>
      v === undefined ? {} : { [k]: v }
    )
  );

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

export function createPrisonPopulationSnapshot(
  rawRecords: RawMetricData
): PrisonPopulationSnapshotRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        count: parseInt(record.count),
        lastUpdated: formatDateString(record.last_updated),
        legalStatus: record.legal_status,
        gender: record.gender as Gender,
        ageGroup: record.age_group as AgeGroup,
        facility: record.facility,
      },
      prisonDimensionDefaults
    );
  });
}

export function createSupervisionPopulationSnapshot(
  rawRecords: RawMetricData
): SupervisionPopulationSnapshotRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        count: parseInt(record.count),
        lastUpdated: formatDateString(record.last_updated),
        supervisionType: record.supervision_type as SupervisionType,
        gender: record.gender as Gender,
        ageGroup: record.age_group as AgeGroup,
        district: record.district,
        mostSevereViolation: record.most_severe_violation,
        numberOfViolations: record.number_of_violations,
      },
      supervisionDimensionDefaults
    );
  });
}

export function createPrisonPopulationPersonLevelList(
  rawRecords: RawMetricData
): PrisonPopulationPersonLevelRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        stateId: record.state_id,
        fullName: record.full_name,
        lastUpdated: formatDateString(record.last_updated),
        age: record.age,
        legalStatus: record.legal_status,
        gender: record.gender as Gender,
        ageGroup: record.age_group as AgeGroup,
        facility: record.facility,
      },
      prisonDimensionDefaults
    );
  });
}

export function createPrisonPopulationTimeSeries(
  rawRecords: RawMetricData
): PrisonPopulationTimeSeriesRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        year: Number(record.year),
        month: Number(record.month),
        totalPopulation: parseInt(record.count),
        legalStatus: record.legal_status,
        gender: record.gender as Gender,
        ageGroup: record.age_group as AgeGroup,
        facility: record.facility,
      },
      prisonDimensionDefaults
    );
  });
}

export function createSupervisionPopulationTimeSeries(
  rawRecords: RawMetricData,
  countField: string
): SupervisionPopulationTimeSeriesRecord[] {
  return rawRecords
    .map((record) => {
      return mergeDefaults(
        {
          year: Number(record.year),
          month: Number(record.month),
          count: parseInt(record[countField]),
          avg90day: parseInt(record.avg_90day),
          gender: record?.gender as Gender,
          district: record?.district,
          mostSevereViolation: record.most_severe_violation,
          numberOfViolations: record.number_of_violations,
          supervisionType: record.supervision_type as SupervisionType,
        },
        supervisionDimensionDefaults
      );
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

export const formatDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};
