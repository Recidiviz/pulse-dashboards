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
  US_ID,
  US_ME,
  US_ND,
  US_TN,
} from "../../RootStore/TenantStore/pathwaysTenants";
import { MetricCopy, PageCopy } from "../content/types";
/**
 * All data comes back from the server as string values;
 * it will be up to us to cast those strings to other types as needed
 */
export type ApiData = {
  data: RawMetricData;
  metadata: Record<string, string>;
};

export type RawApiData = Record<string, ApiData>;
export type RawMetricData = Record<string, string>[];

export const TenantIdList = [US_ND, US_ID, US_TN, US_ME] as const;

export type TenantId = typeof TenantIdList[number];
export type Gender = "ALL" | "FEMALE" | "MALE";
export type AgeGroup =
  | "ALL"
  | "<24"
  | "25-29"
  | "30-34"
  | "35-39"
  | "40-44"
  | "45-49"
  | "50-54"
  | "55+";
export type LengthOfStayRawValue =
  | "all"
  | "months_0_3"
  | "months_3_6"
  | "months_6_9"
  | "months_9_12"
  | "months_12_15"
  | "months_15_18"
  | "months_18_21"
  | "months_21_24"
  | "months_24_36"
  | "months_36_48"
  | "months_48_60";

export type LengthOfStay =
  | "ALL"
  | "0"
  | "3"
  | "6"
  | "9"
  | "12"
  | "15"
  | "18"
  | "21"
  | "24"
  | "36"
  | "48"
  | "60";

export type SimulationCompartment = "SUPERVISION" | "INCARCERATION";
export type SupervisionType = "PAROLE" | "PROBATION" | "ALL";
export type TimePeriod = "6" | "12" | "24" | "60";
export type TimePeriodRawValue =
  | "months_0_6"
  | "months_7_12"
  | "months_13_24"
  | "months_25_60";

export type MetricRecord =
  | PopulationProjectionTimeSeriesRecord
  | PracticesSummaryRecord
  | PracticesTimeSeriesRecord
  | PrisonPopulationTimeSeriesRecord
  | PrisonPopulationSnapshotRecord
  | SupervisionPopulationTimeSeriesRecord
  | SupervisionPopulationSnapshotRecord
  | PrisonPopulationPersonLevelRecord
  | LibertyPopulationTimeSeriesRecord
  | LibertyPopulationSnapshotRecord;

export type PopulationProjectionTimeSeriesRecord = {
  totalPopulation: number;
  totalPopulationMax: number;
  totalPopulationMin: number;
  year: number;
  month: number;
  compartment: SimulationCompartment;
  legalStatus: string;
  gender: Gender;
  simulationTag: string;
};

export type PrisonPopulationSnapshotRecord = {
  count: number;
  lastUpdated: Date;
  gender: Gender;
  ageGroup: AgeGroup;
  admissionReason: string;
  facility: string;
  lengthOfStay: LengthOfStay;
  timePeriod: TimePeriod;
};

export type PrisonPopulationPersonLevelRecord = {
  lastUpdated: Date;
  stateId: string;
  fullName: string;
  gender: Gender;
  ageGroup: AgeGroup;
  age: string;
  admissionReason: string;
  facility: string;
  timePeriod: TimePeriod;
};

export type PrisonPopulationTimeSeriesRecord = {
  count: number;
  avg90day: number;
  year: number;
  month: number;
  gender: Gender;
  ageGroup: AgeGroup;
  admissionReason: string;
  facility: string;
  race: string;
};

export type SupervisionPopulationSnapshotRecord = {
  count: number;
  lastUpdated: Date;
  gender: Gender;
  ageGroup: AgeGroup;
  supervisionType: SupervisionType;
  district: string;
  mostSevereViolation: string;
  numberOfViolations: string;
  lengthOfStay: string;
  supervisionLevel: string;
  race: string;
  timePeriod: TimePeriod;
};

export type SupervisionPopulationTimeSeriesRecord = {
  count: number;
  avg90day: number;
  year: number;
  month: number;
  gender: Gender;
  supervisionType: SupervisionType;
  district: string;
  mostSevereViolation: string;
  numberOfViolations: string;
  supervisionLevel: string;
  race: string;
  ageGroup: AgeGroup;
};

export type LibertyPopulationSnapshotRecord = {
  count: number;
  lastUpdated: Date;
  gender: Gender;
  ageGroup: AgeGroup;
  judicialDistrict: string;
  race: string;
  priorLengthOfIncarceration: string;
  timePeriod: TimePeriod;
};

export type LibertyPopulationTimeSeriesRecord = {
  count: number;
  avg90day: number;
  year: number;
  month: number;
  gender: Gender;
  judicialDistrict: string;
  race: string;
  ageGroup: AgeGroup;
  priorLengthOfIncarceration: string;
};

export type PracticesTimeSeriesRecord = {
  date: string;
  entityId: string;
  metric: string;
  value: number;
  monthlyAvg: number;
  parentMonthlyAvg?: number;
};

export type MetricValueAccessor =
  | "overall"
  | "timelyDischarge"
  | "timelyContact"
  | "timelyRiskAssessment"
  | "timelyDowngrade";

export type PracticesSummaryRecord = {
  entityId: string;
  entityName: string; // i.e. "North Dakota" or "Oakes"
  entityType: EntityType;
  parentEntityId: string;
  overall: number;
  overall30Day: number;
  overall90Day: number;
  timelyDischarge: number;
  timelyContact: number;
  timelyRiskAssessment: number;
  timelyDowngrade: number;
};

export type EntityType = keyof typeof ENTITY_TYPES;
export const ENTITY_TYPES = {
  STATE: "STATE",
  LEVEL_1_SUPERVISION_LOCATION: "LEVEL_1_SUPERVISION_LOCATION",
  LEVEL_2_SUPERVISION_LOCATION: "LEVEL_2_SUPERVISION_LOCATION",
  PO: "PO",
} as const;

export interface MethodologyContent {
  title: string;
  methodology: string;
}

export type ViewMethodology = {
  practices?: {
    title: string;
    description: string;
    pageCopy: Record<string, MethodologyContent>;
    metricCopy: Record<string, MethodologyContent>;
  };
  operations?: {
    title: string;
    description: string;
    pageCopy: Record<string, MethodologyContent>;
    metricCopy: Record<string, MethodologyContent>;
  };
  system?: {
    title: string;
    description: string;
    pageCopy: PageCopy;
    metricCopy: MetricCopy;
  };
};

/**
 * Describes the hydration state and mechanism,
 * but not what the hydrated object will look like
 * (because it may vary by model)
 */
export interface Hydratable {
  isLoading?: boolean;
  error?: Error;
  dataSeries?:
    | PopulationProjectionTimeSeriesRecord[]
    | PrisonPopulationSnapshotRecord[]
    | SupervisionPopulationSnapshotRecord[]
    | PrisonPopulationTimeSeriesRecord[]
    | SupervisionPopulationTimeSeriesRecord[]
    | LibertyPopulationTimeSeriesRecord[]
    | LibertyPopulationSnapshotRecord[]
    | PrisonPopulationPersonLevelRecord[];
  hydrate: () => void;
}

export type MetricId =
  | "libertyToPrisonPopulationOverTime"
  | "libertyToPrisonPopulationByDistrict"
  | "libertyToPrisonPopulationByGender"
  | "libertyToPrisonPopulationByRace"
  | "libertyToPrisonPopulationByAgeGroup"
  | "libertyToPrisonPopulationByPriorLengthOfIncarceration"
  | "prisonFacilityPopulation"
  | "prisonPopulationOverTime"
  | "projectedPrisonPopulationOverTime"
  | "prisonPopulationPersonLevel"
  | "prisonToSupervisionPopulationOverTime"
  | "prisonToSupervisionPopulationByAge"
  | "prisonToSupervisionPopulationByFacility"
  | "prisonToSupervisionPopulationPersonLevel"
  | "supervisionPopulationOverTime"
  | "projectedSupervisionPopulationOverTime"
  | "supervisionPopulationByDistrict"
  | "supervisionPopulationBySupervisionLevel"
  | "supervisionToPrisonOverTime"
  | "supervisionToPrisonPopulationByDistrict"
  | "supervisionToPrisonPopulationByMostSevereViolation"
  | "supervisionToPrisonPopulationByNumberOfViolations"
  | "supervisionToPrisonPopulationByLengthOfStay"
  | "supervisionToPrisonPopulationBySupervisionLevel"
  | "supervisionToPrisonPopulationByGender"
  | "supervisionToPrisonPopulationByRace"
  | "supervisionToLibertyOverTime"
  | "supervisionToLibertyPopulationByLengthOfStay"
  | "supervisionToLibertyPopulationByLocation"
  | "supervisionToLibertyPopulationByGender"
  | "supervisionToLibertyPopulationByAgeGroup"
  | "supervisionToLibertyPopulationByRace";
