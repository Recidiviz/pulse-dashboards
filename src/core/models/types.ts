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

import { ClientRecord, ResidentRecord } from "../../FirestoreStore";
import {
  US_CO,
  US_ID,
  US_ME,
  US_MI,
  US_ND,
  US_TN,
} from "../../RootStore/TenantStore/pathwaysTenants";
import { OpportunityType } from "../../WorkflowsStore";
import { MetricCopy, PageCopy } from "../content/types";
import { VitalsMetric } from "../PageVitals/types";
import { TableColumns } from "../types/charts";
import { Navigation } from "../types/navigation";

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

export const TenantIdList = [US_CO, US_ND, US_ID, US_TN, US_ME, US_MI] as const;

export type TenantId = typeof TenantIdList[number];
export type TenantConfig = {
  name: string;
  stateCode: string;
  domain?: string;
  availableStateCodes: string[];
  enableUserRestrictions: boolean;
  workflowsEnableAllDistricts?: boolean;
  navigation?: Navigation;
  vitalsMetrics?: VitalsMetric[];
  pagesWithRestrictions?: string[];
  tableColumns?: TableColumns;
  opportunityTypes?: OpportunityType[];
  allowSupervisionTasks?: boolean;
  workflowsSupportedSystems?: SystemId[];
  workflowsSystemConfigs?: {
    INCARCERATION?: WorkflowsSystemConfig<ResidentSearchFields>;
    SUPERVISION?: WorkflowsSystemConfig<ClientSearchFields>;
  };
};

export type ResidentSearchFields = Pick<
  ResidentRecord,
  "officerId" | "facilityId" | "unitId"
>;

export type ClientSearchFields = Pick<ClientRecord, "officerId">;

export type WorkflowsSystemConfig<T> = {
  searchType: SearchType;
  searchField: keyof T;
  searchTitleOverride?: string;
};

export type Searchable = {
  searchLabel: string;
  searchId: string;
};

export type SystemId = "INCARCERATION" | "SUPERVISION";
export type SearchType = "OFFICER" | "LOCATION";

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
  | "unknown"
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
  | "UNKNOWN"
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
  | VitalsSummaryRecord
  | VitalsTimeSeriesRecord
  | PrisonPopulationSnapshotRecord
  | SupervisionPopulationSnapshotRecord
  | PrisonPopulationPersonLevelRecord
  | LibertyPopulationSnapshotRecord
  | TimeSeriesDataRecord
  | SnapshotDataRecord
  | PersonLevelDataRecord;

export type NewBackendRecord<RecordType extends MetricRecord> = {
  data: RecordType[];
  metadata: {
    lastUpdated: string;
  };
};

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
  race: string;
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
  lengthOfStay: LengthOfStay;
  supervisionLevel: string;
  race: string;
  timePeriod: TimePeriod;
  officerName: string;
  caseload: number;
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

export type TimeSeriesDataRecord = {
  count: number;
  year: number;
  month: number;
  avg90day: number;
};

/* Superset of all the SnapshotRecords, but with all fields except "count" optional */
export type SnapshotDataRecord = Partial<
  PrisonPopulationSnapshotRecord &
    SupervisionPopulationSnapshotRecord &
    LibertyPopulationSnapshotRecord
> & { count: number };

export type PersonLevelDataRecord = PrisonPopulationPersonLevelRecord & {
  lastUpdated?: Date;
};

export type VitalsTimeSeriesRecord = {
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

export type VitalsSummaryRecord = {
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
  operations?: {
    title: string;
    description: string;
    pageCopy: Record<string, MethodologyContent>;
    metricCopy: Record<string, MethodologyContent>;
  };
  system?: {
    title: string;
    description: string;
    descriptionSecondary?: string;
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
  isHydrated: boolean;
  error?: Error;
  hydrate: () => void;
}

export interface HydratablePathwaysMetric extends Hydratable {
  dataSeries?: PathwaysMetricRecords;
  isEmpty?: boolean;
}

export type PathwaysMetricRecords =
  | PopulationProjectionTimeSeriesRecord[]
  | PrisonPopulationSnapshotRecord[]
  | SupervisionPopulationSnapshotRecord[]
  | LibertyPopulationSnapshotRecord[]
  | PrisonPopulationPersonLevelRecord[]
  | TimeSeriesDataRecord[]
  | SnapshotDataRecord[]
  | PersonLevelDataRecord[];

export type MetricId =
  | "libertyToPrisonPopulationOverTime"
  | "libertyToPrisonPopulationByDistrict"
  | "libertyToPrisonPopulationByGender"
  | "libertyToPrisonPopulationByRace"
  | "libertyToPrisonPopulationByAgeGroup"
  | "libertyToPrisonPopulationByPriorLengthOfIncarceration"
  | "prisonPopulationOverTime"
  | "prisonFacilityPopulation"
  | "prisonPopulationByRace"
  | "projectedPrisonPopulationOverTime"
  | "prisonPopulationPersonLevel"
  | "prisonToSupervisionPopulationOverTime"
  | "prisonToSupervisionPopulationByAge"
  | "prisonToSupervisionPopulationByFacility"
  | "prisonToSupervisionPopulationByRace"
  | "prisonToSupervisionPopulationPersonLevel"
  | "supervisionPopulationOverTime"
  | "projectedSupervisionPopulationOverTime"
  | "supervisionPopulationByDistrict"
  | "supervisionPopulationByRace"
  | "supervisionPopulationBySupervisionLevel"
  | "supervisionToPrisonOverTime"
  | "supervisionToPrisonPopulationByDistrict"
  | "supervisionToPrisonPopulationByMostSevereViolation"
  | "supervisionToPrisonPopulationByNumberOfViolations"
  | "supervisionToPrisonPopulationByLengthOfStay"
  | "supervisionToPrisonPopulationBySupervisionLevel"
  | "supervisionToPrisonPopulationByGender"
  | "supervisionToPrisonPopulationByRace"
  | "supervisionToPrisonPopulationByOfficer"
  | "supervisionToLibertyOverTime"
  | "supervisionToLibertyPopulationByLengthOfStay"
  | "supervisionToLibertyPopulationByLocation"
  | "supervisionToLibertyPopulationByGender"
  | "supervisionToLibertyPopulationByAgeGroup"
  | "supervisionToLibertyPopulationByRace";
