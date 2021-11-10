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
import { US_ND } from "../../RootStore/TenantStore/coreTenants";
import { US_ID, US_TN } from "../../RootStore/TenantStore/pathwaysTenants";
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

export const TenantIdList = [US_ND, US_ID, US_TN] as const;

export type TenantId = typeof TenantIdList[number];
export type Gender = "ALL" | "FEMALE" | "MALE";
export type Age =
  | "ALL"
  | "LESS_THAN_24"
  | "25_29"
  | "30_34"
  | "35_39"
  | "40_44"
  | "45_49"
  | "50_54"
  | "GREATER_THAN_55";
export type SimulationCompartment = "SUPERVISION" | "INCARCERATION";
export type SupervisionType = "PAROLE" | "PROBATION" | "ALL";

export type MetricRecord =
  | PopulationProjectionTimeSeriesRecord
  | PracticesSummaryRecord
  | PracticesTimeSeriesRecord
  | SupervisionCountTimeSeriesRecord
  | PopulationTimeSeriesRecord
  | PopulationSnapshotRecord
  | IncarcerationPopulationPersonLevelRecord;

export type PopulationProjectionTimeSeriesRecord = {
  year: number;
  month: number;
  compartment: SimulationCompartment;
  legalStatus: string;
  gender: Gender;
  simulationTag: string;
  totalPopulation: number;
  totalPopulationMax: number;
  totalPopulationMin: number;
};

export type PopulationSnapshotRecord = {
  year: number;
  month: number;
  legalStatus: string;
  gender: Gender;
  facility: string;
  age: Age;
  totalPopulation: number;
};

export type IncarcerationPopulationPersonLevelRecord = {
  stateId: string;
  fullName: string;
  lastUpdated: Date;
  legalStatus: string;
  gender: Gender;
  facility: string;
  ageGroup: Age;
  age: string;
};

export type PopulationTimeSeriesRecord = PopulationSnapshotRecord & {
  year: number;
  month: number;
};

export type SupervisionCountTimeSeriesRecord = {
  year: number;
  month: number;
  gender: Gender;
  supervisionType: SupervisionType;
  count: number;
  avg90day: number;
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
    | PopulationSnapshotRecord[]
    | PopulationTimeSeriesRecord[]
    | SupervisionCountTimeSeriesRecord[]
    | IncarcerationPopulationPersonLevelRecord[];
  hydrate: () => void;
}

export type MetricId =
  | "prisonFacilityPopulation"
  | "prisonPopulationOverTime"
  | "projectedPrisonPopulationOverTime"
  | "supervisionPopulationOverTime"
  | "supervisionToPrisonOverTime"
  | "supervisionToLibertyOverTime"
  | "incarcerationPopulationPersonLevel";
