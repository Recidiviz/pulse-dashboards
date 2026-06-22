// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
  ClientRecord,
  LocationRecord,
  MilestoneType,
  StaffRecord,
  SystemId,
  WorkflowsResidentRecord,
} from "~datatypes";
import { FirestoreCollectionName } from "~firestore-config";
import {
  type LibertyPopulationSnapshotRecord,
  type PersonLevelDataRecord,
  type PopulationProjectionTimeSeriesRecord,
  type PrisonPopulationPersonLevelRecord,
  type PrisonPopulationSnapshotRecord,
  type SnapshotDataRecord,
  type SupervisionPopulationSnapshotRecord,
  type TimeSeriesDataRecord,
} from "~shared-pathways";

import { SupervisionTaskUpdate } from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import {
  FeatureVariant,
  FeatureVariantRecord,
  TenantConfigId,
  TenantId,
} from "../../RootStore/types";
import { Leaves } from "../../utils/typeUtils";
import type {
  Client,
  StaffFilterFunction,
  SupervisionTask,
} from "../../WorkflowsStore";
import type { Task } from "../../WorkflowsStore/Task/Task";
import type {
  SnoozeOptions,
  SupervisionTaskRecord,
  SupervisionTaskType,
} from "../../WorkflowsStore/Task/types";
import { VitalsMetric } from "../PageVitals/types";
import { TableColumns } from "../types/charts";
import { Navigation } from "../types/navigation";
import { WorkflowsPathSection } from "../views";
import { ClientDetailComponentName } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { SupervisionTaskCategory } from "../WorkflowsTasks/fixtures";
import { TaskTableColumnId } from "../WorkflowsTasks/TasksTable";

export type TenantConfig<TENANT_ID extends TenantConfigId> = {
  name: string;
  stateCode: string;
  domain?: string;
  DOCName?: string;
  internalSystemName?: string;
  availableStateCodes: TenantId[];
  navigation?: Navigation;
  featureVariants?: FeatureVariantRecord; // default values for all users in this tenant
  facilitiesDisplayIdCopy?: string;
  supervisionDisplayIdCopy?: string;

  // Product-specific settings

  enableUserRestrictions: boolean; // used for Lantern
  vitalsMetrics?: VitalsMetric[];
  tableColumns?: TableColumns; // used for Pathways
  pathwaysNameOverride?: "Pathways" | "System-Level Trends";

  // Workflows
  workflowsSupportedSystems?: SystemId[];
  workflowsSystemConfigs?: {
    INCARCERATION?: WorkflowsSystemConfig<WorkflowsResidentRecord, TENANT_ID>;
    SUPERVISION?: WorkflowsSystemConfig<ClientRecord, TENANT_ID>;
  };
  workflowsHomepage?: WorkflowsPathSection;
  workflowsHomepageName?: string;
  workflowsTasksConfig?: WorkflowsTasksConfig;
  workflowsOpportunityFilterConfig?: FilterConfig;
  workflowsMethodologyUrl?: string;
  milestoneTypes?: MilestoneType[];
  releaseDateCopyOverride?: string;
  supervisionEndCopyOverride?: string;
  incarcerationStaffTitleOverride?: string;
  custodyLevelCopy?: Record<string, string>;

  // Session
  sessionTimeoutMinutes?: number;

  // Insights
  insightsLaunchedDistricts?: string[];
  insightsLanternState?: boolean;
  insightsUnitState?: boolean;
  // For Last Login Module. Number of days without a login where we flag someone for not having logged in in that amount of time
  insightsNumDaysWithoutLogin?: number;
  directorDashboard?: {
    navTitle: string;
    lookerDashboard: string;
  };
};

/**
 * Describes the filtering we do when reading staff from firestore.
 * The user may only see caseloads where the value of the filterField is one of the filterValues.
 */
export type StaffFilter = {
  filterField: keyof StaffRecord;
  filterValues: string[];
};

export interface FilterConfig {
  filters?: FilterSection[];
}

export interface WorkflowsTasksConfig extends FilterConfig {
  collection: FirestoreCollectionName;
  methodologyUrl?: string;
  tasks: {
    [K in SupervisionTaskType]?: {
      constructor: new (
        rootStore: RootStore,
        task: SupervisionTaskRecord<K>,
        person: Client,
        updates?: SupervisionTaskUpdate[K],
      ) => Task<K>;
      snoozeForOptionsInDays?: Array<SnoozeOptions>;
    };
  };
  columns?: TaskTableColumnId[];
  sideBarComponents?: ClientDetailComponentName[];
  categories?: SupervisionTaskCategory[];
  pageDescriptionMarkdown?: string;
}

export type TaskFilterValue = string | boolean;
export type FilterOption = {
  value: TaskFilterValue;
  label?: string;
  shortLabel?: string;
};
export type FilterFieldForPerson = keyof Client;
export type FilterFieldForTask = keyof SupervisionTask;
export type FilterFieldForOpportunity = string;
export type FilterField =
  | FilterFieldForPerson
  | FilterFieldForTask
  | FilterFieldForOpportunity;
export type FilterType = "person" | "task" | "opportunity" | "usNcRNA";

export type FilterSection<T extends FilterType = FilterType> = {
  title: string;
  type: T;
  field: FilterField;
  options: FilterOption[];
};

export type SearchConfig<R, T extends TenantConfigId> = {
  searchType: SearchType;
  searchField: Leaves<R & { metadata: { stateCode: T } }> & string[];
  searchTitle: string;
  searchTitleIgnoreCase?: boolean;
  searchOp?: "in" | "array-contains-any";
  onlySurfaceEligible?: boolean;
  restrictedToFeatureVariant?: FeatureVariant;
};

export type WorkflowsSystemConfig<R, T extends TenantConfigId> = {
  search: SearchConfig<R, T>[];
  staffFilterFn?: StaffFilterFunction;
};

export type AnyWorkflowsSystemConfig =
  | WorkflowsSystemConfig<ClientRecord, any>
  | WorkflowsSystemConfig<WorkflowsResidentRecord, any>;

export type SearchIcon = "flag";

export type Searchable = {
  searchLabel: string;
  searchId: string;
  icon?: SearchIcon;
};

export type SearchableGroup = {
  groupLabel: string;
  searchables: Searchable[];
};

export type SearchType =
  | "OFFICER"
  | "INCARCERATION_OFFICER"
  | "CASELOAD"
  | "DISTRICT"
  | "FACILITY"
  | "FACILITY_UNIT"
  | "US_ID_CRC_FACILITY"
  | "ALL";

export const locationIdsBySearchType = {
  DISTRICT: "districtId",
  FACILITY: "facilityId",
  FACILITY_UNIT: "facilityUnitId",
  US_ID_CRC_FACILITY: "crcFacilityId",
} as const satisfies Partial<Record<SearchType, LocationRecord["idType"]>>;

export type LocationSearchType = keyof typeof locationIdsBySearchType;

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
  | "timelyContactDueDateBased"
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
  timelyContactDueDateBased: number;
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

/**
 * Staff-level MetricRecord includes pathways records, vitals records,
 * and workflows impact records. The pathways record types are imported
 * from ~shared-pathways.
 */
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

export type NewBackendMetricMetadata = {
  lastUpdated: string;
  dynamicFilterOptions: string;
};

export type NewBackendRecord<RecordType extends MetricRecord> = {
  data: RecordType[];
  metadata: NewBackendMetricMetadata;
};
