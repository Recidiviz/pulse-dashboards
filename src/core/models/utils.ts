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
import { every } from "lodash";
import { property } from "lodash/fp";
import moment from "moment";

import { toTitleCase } from "../../utils";
import { Dimension } from "../types/dimensions";
import {
  EnabledFilter,
  EnabledFilters,
  PopulationFilterValues,
} from "../types/filters";
import {
  AgeGroup,
  Gender,
  LengthOfStay,
  LengthOfStayRawValue,
  LibertyPopulationSnapshotRecord,
  LibertyPopulationTimeSeriesRecord,
  MetricRecord,
  PopulationProjectionTimeSeriesRecord,
  PrisonPopulationPersonLevelRecord,
  PrisonPopulationSnapshotRecord,
  PrisonPopulationTimeSeriesRecord,
  RawMetricData,
  SimulationCompartment,
  SupervisionPopulationSnapshotRecord,
  SupervisionPopulationTimeSeriesRecord,
  SupervisionType,
  TimePeriod,
  TimePeriodRawValue,
} from "./types";

const sharedDimensionDefaults = {
  gender: "ALL" as Gender,
  ageGroup: "ALL" as AgeGroup,
};

const supervisionDimensionDefaults = {
  ...sharedDimensionDefaults,
  mostSevereViolation: "ALL",
  numberOfViolations: "ALL",
  supervisionLevel: "ALL",
  supervisionType: "ALL",
  race: "ALL",
  district: "ALL",
  lengthOfStay: "ALL",
  officerName: "ALL",
};

const libertyDimensionDefaults = {
  ...sharedDimensionDefaults,
  priorLengthOfIncarceration: "ALL",
  race: "ALL",
  judicialDistrict: "ALL",
};

const prisonDimensionDefaults = {
  ...sharedDimensionDefaults,
  admissionReason: "ALL",
  facility: "ALL",
  lengthOfStay: "ALL",
};

const timePeriodMap = {
  months_0_6: "6",
  months_7_12: "12",
  months_13_24: "24",
  months_25_60: "60",
} as Record<TimePeriodRawValue, TimePeriod>;

const lengthOfStayMap = {
  months_0_3: "3",
  months_3_6: "6",
  months_6_9: "9",
  months_9_12: "12",
  months_12_15: "15",
  months_15_18: "18",
  months_18_21: "21",
  months_21_24: "24",
  months_24_36: "36",
  months_36_48: "48",
  months_48_60: "60",
  unknown: "UNKNOWN",
  all: "ALL",
} as Record<LengthOfStayRawValue, LengthOfStay>;

const mergeDefaults = (
  record: any,
  defaults: any,
  enabledFilters: EnabledFilters
) =>
  Object.assign(
    {},
    defaults,
    ...Object.entries(record).map(([k, v]) => {
      if (v === undefined) {
        return enabledFilters.includes(k as EnabledFilter)
          ? { [k]: "Unknown" }
          : {};
      }
      return { [k]: v };
    })
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
  rawRecords: RawMetricData,
  enabledFilters: EnabledFilters
): PrisonPopulationSnapshotRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        count: parseInt(record.event_count) || parseInt(record.person_count),
        lastUpdated: formatDateString(record.last_updated),
        admissionReason: record.legal_status,
        gender: record.gender as Gender,
        ageGroup: record.age_group as AgeGroup,
        facility: record.facility,
        lengthOfStay:
          record.length_of_stay &&
          lengthOfStayMap[
            record.length_of_stay.toLowerCase() as LengthOfStayRawValue
          ],
        timePeriod:
          record.time_period &&
          timePeriodMap[record.time_period.toLowerCase() as TimePeriodRawValue],
        race: record.race,
      },
      prisonDimensionDefaults,
      enabledFilters
    );
  });
}

export function createSupervisionPopulationSnapshot(
  rawRecords: RawMetricData,
  enabledFilters: EnabledFilters
): SupervisionPopulationSnapshotRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        count: parseInt(record.event_count) || parseInt(record.person_count),
        lastUpdated: formatDateString(record.last_updated),
        supervisionType: record.supervision_type as SupervisionType,
        gender: record.gender as Gender,
        ageGroup: record.age_group as AgeGroup,
        district: record.district ? record.district.toUpperCase() : "Unknown",
        mostSevereViolation: record.most_severe_violation,
        numberOfViolations: record.number_of_violations,
        lengthOfStay:
          record.length_of_stay &&
          lengthOfStayMap[
            record.length_of_stay.toLowerCase() as LengthOfStayRawValue
          ],
        supervisionLevel: record.supervision_level,
        race: record.race,
        officerName:
          record.officer_name && record.officer_name.toLowerCase() === "all"
            ? record.officer_name
            : toTitleCase(record.officer_name),
        caseload: record.caseload && parseInt(record.caseload),
        priorLengthOfIncarceration: record.prior_length_of_incarceration,
        timePeriod:
          record.time_period &&
          timePeriodMap[record.time_period.toLowerCase() as TimePeriodRawValue],
      },
      supervisionDimensionDefaults,
      enabledFilters
    );
  });
}

export function createPrisonPopulationPersonLevelList(
  rawRecords: RawMetricData,
  enabledFilters: EnabledFilters
): PrisonPopulationPersonLevelRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        stateId: record.state_id || "Unknown",
        fullName: record.full_name || "Unknown",
        lastUpdated: formatDateString(record.last_updated),
        age: record.age || "Unknown",
        admissionReason: record.legal_status || "Unknown",
        gender: (record.gender as Gender) || "Unknown",
        ageGroup: (record.age_group as AgeGroup) || "Unknown",
        facility: record.facility || "Unknown",
        timePeriod:
          timePeriodMap[
            record.time_period?.toLowerCase() as TimePeriodRawValue
          ],
        race: record.race || "Unknown",
      },
      {},
      enabledFilters
    );
  });
}

export function createPrisonPopulationTimeSeries(
  rawRecords: RawMetricData,
  enabledFilters: EnabledFilters
): PrisonPopulationTimeSeriesRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        year: Number(record.year),
        month: Number(record.month),
        count: record.event_count
          ? parseInt(record.event_count)
          : parseInt(record.person_count),
        admissionReason: record.legal_status,
        gender: record.gender as Gender,
        ageGroup: record.age_group as AgeGroup,
        facility: record.facility,
        district: record.district?.toUpperCase(),
        supervisionLevel: record.supervision_level,
        supervisionType: record.supervision_type as SupervisionType,
        race: record.race,
      },
      prisonDimensionDefaults,
      enabledFilters
    );
  });
}

export function createSupervisionPopulationTimeSeries(
  rawRecords: RawMetricData,
  enabledFilters: EnabledFilters
): SupervisionPopulationTimeSeriesRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        year: Number(record.year),
        month: Number(record.month),
        count: record.event_count
          ? parseInt(record.event_count)
          : parseInt(record.person_count),
        supervisionType: record.supervision_type as SupervisionType,
        gender: record.gender as Gender,
        district: record.district?.toUpperCase(),
        mostSevereViolation: record.most_severe_violation,
        numberOfViolations: record.number_of_violations,
        supervisionLevel: record.supervision_level,
        race: record.race,
        ageGroup: record.age_group as AgeGroup,
      },
      supervisionDimensionDefaults,
      enabledFilters
    );
  });
}

export function createLibertyPopulationTimeSeries(
  rawRecords: RawMetricData,
  enabledFilters: EnabledFilters
): LibertyPopulationTimeSeriesRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        year: Number(record.year),
        month: Number(record.month),
        count: parseInt(record.event_count),
        gender: record.gender as Gender,
        ageGroup: record.age_group as AgeGroup,
        judicialDistrict: record.judicial_district
          ? record.judicial_district.toUpperCase()
          : "Unknown",
        race: record.race,
        priorLengthOfIncarceration: record.prior_length_of_incarceration,
      },
      libertyDimensionDefaults,
      enabledFilters
    );
  });
}

export function createLibertyPopulationSnapshot(
  rawRecords: RawMetricData,
  enabledFilters: EnabledFilters
): LibertyPopulationSnapshotRecord[] {
  return rawRecords.map((record) => {
    return mergeDefaults(
      {
        count: parseInt(record.event_count),
        lastUpdated: formatDateString(record.last_updated),
        gender: record.gender as Gender,
        ageGroup: record.age_group as AgeGroup,
        judicialDistrict: record.judicial_district
          ? record.judicial_district.toUpperCase()
          : "Unknown",
        race: record.race,
        priorLengthOfIncarceration: record.prior_length_of_incarceration,
        timePeriod:
          record.time_period &&
          timePeriodMap[record.time_period.toLowerCase() as TimePeriodRawValue],
      },
      libertyDimensionDefaults,
      enabledFilters
    );
  });
}

export interface TimeSeriesRecord {
  month: number;
  year: number;
}

export function getRecordDate(d: TimeSeriesRecord): Date {
  return new Date(d.year, d.month - 1);
}

export const formatDateString = (dateString: string): Date | undefined => {
  if (!moment(dateString, "YYYY-MM-DD", true).isValid()) return undefined;
  const [year, month, day] = dateString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const filterTimePeriod = (
  shouldFilter = false,
  recordTimePeriodValue: TimePeriod,
  filterTimePeriodValue: TimePeriod
): boolean => {
  return shouldFilter
    ? Number(recordTimePeriodValue) <= Number(filterTimePeriodValue)
    : true;
};

export const filterUnknownLengthOfStay = (
  recordLengthOfStayValue: LengthOfStay
): boolean => {
  return recordLengthOfStayValue !== "UNKNOWN";
};

export const filterRecordByDimensions = (
  record: MetricRecord,
  dimensions: Dimension[],
  filters: PopulationFilterValues,
  accessor?: string
): boolean => {
  return dimensions.every((dimensionId) => {
    // @ts-ignore
    const dimensionRecord = record[dimensionId];
    const filterDimension = dimensionId as keyof PopulationFilterValues;

    if (accessor === dimensionId) {
      return !["ALL"].includes(dimensionRecord);
    }
    if (!filters[filterDimension]) {
      return ["ALL"].includes(dimensionRecord);
    }
    return filters[filterDimension].includes(dimensionRecord);
  });
};

export const properties = (...keys: string[]): CallableFunction => (
  obj: Record<string, any>
) => keys.map((key) => property(key, obj));

type AndPredicate = (item: any) => boolean;

export const and = (...predicates: AndPredicate[]): AndPredicate => (item) =>
  every(predicates, (predicate) => predicate(item));

interface DateFilters {
  monthRange: number;
  since: Date;
  stepSize?: number;
}

export const filterRecordByDate = (
  record: TimeSeriesRecord,
  { monthRange, since, stepSize = 1 }: DateFilters
): boolean => {
  const date = getRecordDate(record);
  const monthsOut = Math.abs(
    (date.getFullYear() - since.getFullYear()) * 12 +
      (date.getMonth() - since.getMonth())
  );

  return monthsOut <= monthRange && monthsOut % stepSize === 0;
};
export const filterPersonLevelRecordByDimensions = (
  record: MetricRecord,
  dimensions: Dimension[],
  filters: PopulationFilterValues
): boolean => {
  const handleFilters = (filter: string[] | string, recordValue: string) => {
    const allFilters = Array.isArray(filter) ? filter : [filter];

    if (allFilters.includes("ALL")) {
      return recordValue !== "ALL";
    }

    return allFilters.includes(recordValue);
  };

  return dimensions.every((dimensionId) => {
    // @ts-ignore
    const dimensionRecord = record[dimensionId];
    const filterDimension = dimensionId as keyof PopulationFilterValues;

    return handleFilters(filters[filterDimension], dimensionRecord);
  });
};

export const getTimePeriodRawValue = (
  months: string | number
): string | undefined => {
  return Object.keys(timePeriodMap).find(
    (timePeriodRawValue) =>
      timePeriodMap[timePeriodRawValue as TimePeriodRawValue] === String(months)
  );
};
