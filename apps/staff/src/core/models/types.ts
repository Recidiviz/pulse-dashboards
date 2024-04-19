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

import { StaffRecord } from "~datatypes";
import { Hydratable } from "~hydration-utils";

import {
  ClientRecord,
  MilestoneType,
  SupervisionTaskUpdate,
  WorkflowsResidentRecord,
} from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { FeatureVariant, TenantId } from "../../RootStore/types";
import {
  JusticeInvolvedPerson,
  OpportunityType,
  StaffFilterFunction,
} from "../../WorkflowsStore";
import { Task } from "../../WorkflowsStore/Task/Task";
import {
  SupervisionTaskRecord,
  SupervisionTaskType,
} from "../../WorkflowsStore/Task/types";
import { MetricCopy, PageCopy } from "../content/types";
import { VitalsMetric } from "../PageVitals/types";
import { TableColumns } from "../types/charts";
import { Navigation } from "../types/navigation";
import { WorkflowsPage } from "../views";

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

export type TenantConfig = {
  name: string;
  stateCode: string;
  domain?: string;
  DOCName?: string;
  internalSystemName?: string;
  availableStateCodes: TenantId[];
  enableUserRestrictions: boolean;
  navigation?: Navigation;
  vitalsMetrics?: VitalsMetric[];
  tableColumns?: TableColumns;
  opportunityTypes?: OpportunityType[];
  workflowsSupportedSystems?: SystemId[];
  workflowsSystemsGatedByFeatureVariant?: Partial<
    Record<SystemId, FeatureVariant[]>
  >;
  workflowsSystemConfigs?: {
    INCARCERATION?: WorkflowsSystemConfig<ResidentSearchFields>;
    SUPERVISION?: WorkflowsSystemConfig<ClientSearchFields>;
  };
  workflowsHomepage?: WorkflowsPage;
  workflowsTasksConfig?: SnoozeTaskConfig;
  tasks?: {
    [k in SupervisionTaskType]: new (
      rootStore: RootStore,
      task: SupervisionTaskRecord<k>,
      person: JusticeInvolvedPerson,
      updates?: SupervisionTaskUpdate[k],
    ) => Task<k>;
  };
  milestoneTypes?: MilestoneType[];
  pathwaysNameOverride?: "Pathways" | "System-Level Trends";
  workflowsStaffFilterFn?: StaffFilterFunction;
  insightsLaunchedDistricts?: string[];
  insightsLanternState?: boolean;
};

/**
 * Describes the filtering we do when reading staff from firestore.
 * The user may only see caseloads where the value of the filterField is one of the filterValues.
 */
export type StaffFilter = {
  filterField: keyof StaffRecord;
  filterValues: string[];
};

type ValidSnoozeForDays = 7 | 30 | 90;

export type SnoozeTaskConfig = {
  [k in SupervisionTaskType]?: {
    enabled: boolean;
    snoozeForOptionsInDays: Array<ValidSnoozeForDays>;
  };
};

export type ResidentSearchFields = Pick<
  WorkflowsResidentRecord,
  "officerId" | "facilityId" | "facilityUnitId"
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

export type SearchableGroup = {
  groupLabel: string;
  searchables: Searchable[];
};

export type SystemId = "INCARCERATION" | "SUPERVISION" | "ALL";
export type SearchType = "OFFICER" | "CASELOAD" | "LOCATION" | "ALL";

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
  | PersonLevelDataRecord
  | UsTnCompliantReportingWorkflowsImpactRecord;

export type NewBackendRecord<RecordType extends MetricRecord> = {
  data: RecordType[];
  metadata: {
    lastUpdated: string;
  };
};

export type UsTnCompliantReportingWorkflowsImpactRecord = {
  stateCode: string;
  supervisionDistrict: string;
  districtName: string;
  variantId: string;
  variantDate: Date;
  startDate: Date;
  endDate: Date;
  monthsSinceTreatment: number;
  avgDailyPopulation: number;
  avgPopulationLimitedSupervisionLevel: number;
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
