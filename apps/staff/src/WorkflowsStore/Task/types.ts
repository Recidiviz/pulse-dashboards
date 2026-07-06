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

import type { VitalsMetricId } from "~datatypes";
import type { Hydratable } from "~hydration-utils";

import type { WorkflowsTasksConfig } from "../../core/models/types";
import type { SupervisionTaskCategory } from "../../core/WorkflowsTasks/fixtures";
import type {
  CustomTaskRecord,
  SharedSnoozeUpdate,
} from "../../FirestoreStore";
import type { RootStore } from "../../RootStore";
import type { SpecificTenantConfigs } from "../../tenants";
import type { Expect, Extends } from "../../utils/typeUtils";
import type { Client } from "../Client";

export type SupervisionTasksCaseType = "GENERAL" | "SEX_OFFENSE";

// TODO: Remove optional lastHomeVisit and lastContacted once it's available in the data
type UsIdHomeVisitDetails = {
  caseType: SupervisionTasksCaseType;
  supervisionLevel: string;
  currentAddress: string;
  lastHomeVisit?: string;
};

type UsIdAssessmentDetails = {
  riskLevel: string | null;
  lastAssessedOn: string | null;
};

type UsIdContactDetails = {
  caseType: SupervisionTasksCaseType;
  supervisionLevel: string;
  lastContacted?: string;
};

type UsIdEmploymentDetails = {
  caseType: SupervisionTasksCaseType;
  supervisionLevel: string;
  lastContacted?: string;
};

type UsMoTaskDetails = {
  contactCadence: string;
  lastContactDate: string | null;
};

type UsMoInitialTaskDetails = {
  contactCadence: string;
};

type UsMoHomeVisitTaskDetails = UsMoTaskDetails & {
  supplementaryContacts: {
    contactTypes: string;
    contactDate: string;
  }[];
};

// ND doesn't use line staff-facing tasks currently, so tasks don't have details.
type UsNdEmptyDetails = Record<string, never>;

type UsNeAssessmentDetails = {
  assessmentDueDate: string | null;
  mostRecentAssessmentDate: string | null;
  isFirstAssessment: boolean;
};

type UsNeContactDetails = {
  contactCadence: string;
  contactCount: number;
  contactDueDate: string;
  lastContactDate: string | null;
  overdueFlag: boolean;
  periodType: string;
  typeOfContact: string;
};

type UsTxContactDetails = {
  contactCount: number;
  lastContactDate: string | null;
  overdueFlag: boolean;
  typeOfContact: string;
  contactCadence: string;
  scheduledContactDates: string | null;
};

type UsTxOverridableContactDetails = UsTxContactDetails & {
  overrideContactType:
    | null
    | "SCHEDULED HOME (VIRTUAL)"
    | "UNSCHEDULED HOME (VIRTUAL)";
  officerInCriticallyUnderstaffedLocation: boolean;
};

type UsTxTypeAgnosticContactDetails = {
  contactDueDate: string;
  contactCadence: string;
  lastContactDate: string | null;
  overdueFlag: boolean;
  contactTypesAccepted: string;
  officerInCriticallyUnderstaffedLocation: boolean;
  overrideContactTypesAccepted: string;
  scheduledContactDates: string | null;
};

type UsTxEdgeCaseContactDetails = {
  contactCadence: string;
  scheduledContactDates: string | null;
  causalDate: string;
  criteriaName: string; // raw trigger, e.g. US_TX_MEETS_ADDRESS_CHANGE_HOME_CONTACT_TRIGGER
};

type UsTxAssessmentDetails = {
  eventType: string;
  dueAssessmentDate: string | null;
  eventDate: string;
  frequency: string;
  contactCadence: string;
  dueAssessmentType?: string;
};

export type UsIdTaskBaseDetails = {
  contactCadence: string;
  lastContactDate: string | null;
  contactPeriodStart?: string;
  contactPeriodEnd?: string;
};

type UsIdLsirAssessmentDetails = UsIdTaskBaseDetails & {
  lastAssessmentDate: string | null;
};

type UsIdStableAssessmentDetails = UsIdTaskBaseDetails & {
  lastAssessmentDate: string | null;
};

type UsIdHomeVisitOrAddressChangeDetails = UsIdTaskBaseDetails & {
  addressChangeContactDueDate: string | null;
  addressChangeDate: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CheckSupervisionTaskDetailsMappingType = Expect<
  Extends<
    SupervisionDetailsForTask,
    Record<SupervisionTaskType, SupervisionDetails>
  >
>;

export const SUPERVISION_NEED_TYPES = ["employmentNeed"] as const;

export type SupervisionNeedType = (typeof SUPERVISION_NEED_TYPES)[number];

export const SUPERVISION_TASK_TYPES = [
  // TODO(#10615): Remove 'homeVisit' v1 (keep v2, usIdHomeVisit) task type when UsIdTasksV2 is fully rolled out.
  "homeVisit",
  "usIdHomeVisit",
  // TODO(#10615): Remove 'assessment' v1 (keep v2, usIdRiskAssessment) task type when UsIdTasksV2 is fully rolled out.
  "assessment",
  "usIdLsirAssessment",
  "usIdStableAssessment",
  // TODO(#10615): Remove 'contact' v1 (keep v2, UsIdFaceToFaceContact) task type when UsIdTasksV2 is fully rolled out.
  "contact",
  "usIdFaceToFaceContact",
  // TODO(#10615): Remove 'employment' v1 (keep v2, usIdEmploymentVerification) task type when UsIdTasksV2 is fully rolled out.
  "employment",
  "usIdEmploymentVerification",
  "usMoEmploymentVerification",
  "usMoInitialEmploymentVerificationIap",
  "usMoInitialPositiveContactWithSignificantOtherIap",
  "usMoInitialPositiveContactWithSignificantOtherSmi",
  "usMoInitialPositiveHomeVisitIap",
  "usMoInitialPositiveHomeVisitSmi",
  "usMoPositiveHomeVisit",
  "usMoInPersonContact",
  "usMoPositiveContactWithSignificantOther",
  "usNdContact",
  "usNdRiskAssessment",
  "usNeOrasAssessment",
  "usNeStableAssessment",
  "usNePersonalContact",
  "usNeCollateralContact",
  "usNeNCJISCheckContact",
  "usTxTypeAgnosticContact",
  "usTxCollateralContactScheduled",
  "usTxHomeContactScheduled",
  "usTxHomeContactUnscheduled",
  "usTxHomeContactEdgeCase",
  "usTxInCustodyContact",
  "usTxOfficeContactScheduled",
  "usTxFieldContactScheduled",
  "usTxVirtualOfficeContactScheduled",
  // TODO(#10067) Deprecate usTxVirtualOrOfficeContact
  "usTxVirtualOrOfficeContact",
  "usTxAssessment",
  "usTxHomeContactUnscheduledWeekend",
] as const;

export type SupervisionTaskType = (typeof SUPERVISION_TASK_TYPES)[number];

export type SnoozeOptions = number | "FOREVER";

export type SupervisionDetails =
  | UsIdHomeVisitDetails
  | UsIdAssessmentDetails
  | UsIdTaskBaseDetails
  | UsIdContactDetails
  | UsIdEmploymentDetails
  | UsMoTaskDetails
  | UsMoInitialTaskDetails
  | UsMoHomeVisitTaskDetails
  | UsNdEmptyDetails
  | UsNeAssessmentDetails
  | UsNeContactDetails
  | UsTxContactDetails
  | UsTxTypeAgnosticContactDetails
  | UsTxEdgeCaseContactDetails
  | UsTxAssessmentDetails;

export type SupervisionDetailsForTask = {
  // TODO(#10615): Remove 'homeVisit' v1 (keep v2, usIdHomeVisit) task type when UsIdTasksV2 is fully rolled out.
  homeVisit: UsIdHomeVisitDetails;
  usIdHomeVisit: UsIdHomeVisitOrAddressChangeDetails;
  // TODO(#10615): Remove 'assessment' v1 (keep v2, usIdRiskAssessment) task type when UsIdTasksV2 is fully rolled out.
  assessment: UsIdAssessmentDetails;
  // TODO(#10615): Remove 'contact' v1 (keep v2, UsIdFaceToFaceContact) task type when UsIdTasksV2 is fully rolled out.
  usIdLsirAssessment: UsIdLsirAssessmentDetails;
  usIdStableAssessment: UsIdStableAssessmentDetails;
  contact: UsIdContactDetails;
  // TODO(#10615): Remove 'employment' v1 (keep v2, usIdEmploymentVerification) task type when UsIdTasksV2 is fully rolled out.
  usIdFaceToFaceContact: UsIdTaskBaseDetails;
  employment: UsIdEmploymentDetails;
  usIdEmploymentVerification: UsIdTaskBaseDetails;
  usMoPositiveHomeVisit: UsMoHomeVisitTaskDetails;
  usMoEmploymentVerification: UsMoTaskDetails;
  usMoInitialEmploymentVerificationIap: UsMoInitialTaskDetails;
  usMoInitialPositiveContactWithSignificantOtherIap: UsMoInitialTaskDetails;
  usMoInitialPositiveContactWithSignificantOtherSmi: UsMoInitialTaskDetails;
  usMoInitialPositiveHomeVisitIap: UsMoInitialTaskDetails;
  usMoInitialPositiveHomeVisitSmi: UsMoInitialTaskDetails;
  usMoInPersonContact: UsMoTaskDetails;
  usMoPositiveContactWithSignificantOther: UsMoTaskDetails;
  usNdContact: UsNdEmptyDetails;
  usNdRiskAssessment: UsNdEmptyDetails;
  usNeOrasAssessment: UsNeAssessmentDetails;
  usNeStableAssessment: UsNeAssessmentDetails;
  usNePersonalContact: UsNeContactDetails;
  usNeCollateralContact: UsNeContactDetails;
  usNeNCJISCheckContact: UsNeContactDetails;
  usTxCollateralContactScheduled: UsTxContactDetails;
  usTxTypeAgnosticContact: UsTxTypeAgnosticContactDetails;
  usTxHomeContactScheduled: UsTxOverridableContactDetails;
  usTxHomeContactUnscheduled: UsTxOverridableContactDetails;
  usTxHomeContactEdgeCase: UsTxEdgeCaseContactDetails;
  usTxInCustodyContact: UsTxContactDetails;
  usTxOfficeContactScheduled: UsTxContactDetails;
  usTxFieldContactScheduled: UsTxContactDetails;
  usTxVirtualOfficeContactScheduled: UsTxContactDetails;
  usTxVirtualOrOfficeContact: UsTxTypeAgnosticContactDetails;
  usTxAssessment: UsTxAssessmentDetails;
  usTxHomeContactUnscheduledWeekend: UsTxOverridableContactDetails;
};

export type SnoozeInfo = {
  // Calculated from snoozedOn + snoozeForDays for numeric snoozes; "FOREVER" for permanent snoozes.
  snoozedUntil: Date | "FOREVER";
  snoozeReason?: string;
} & SharedSnoozeUpdate;

export type SupervisionTask<
  T extends SupervisionTaskType = SupervisionTaskType,
> = {
  type: T;
  key: string;
  dueDate: Date;
  details: SupervisionDetailsForTask[T];
  isOverdue: boolean;
  isSnoozed: boolean;
  snoozeInfo?: SnoozeInfo;
  dueDateFromToday: string;
  rootStore: RootStore;
  person: Client;
  displayName: string;
  dueDateDisplayLong: string;
  dueDateDisplayShort: string;
  frequency: string;
  contactWindow: string | undefined;

  // these fields refer to appointments, rather than whether the contact is called a
  // "scheduled contact" or "unscheduled contact"
  scheduledContactDates: Date[] | undefined;
  futureScheduledContacts: Date[] | undefined;
  hasFutureScheduledContact: boolean | undefined;

  supplementaryContacts: string[];

  additionalDetails?: string;
  vitalsMetricId?: VitalsMetricId;
  includeInRoutePlanner: boolean;
  routePlannerDisplayName?: string;
  updateSupervisionTask: (
    snoozeForDays?: SnoozeOptions,
    snoozeReason?: string,
  ) => void;
};

/**
 * Synthetic task-type literal used by user-authored custom tasks (created
 * from a client's FullProfile). It does NOT extend `SUPERVISION_TASK_TYPES`
 * because no per-state task config maps to it — keeping it outside that
 * union avoids polluting `SupervisionDetailsForTask` and the per-state
 * `Task<T>` plumbing. Custom-task rows are recognized via the
 * discriminator on `TaskTableItem`.
 */
export const CUSTOM_TASK_TYPE = "customTask" as const;
export type CustomTaskType = typeof CUSTOM_TASK_TYPE;

/**
 * View-model for a single custom task in the Tasks dashboard table. Mirrors
 * the subset of `SupervisionTask` the bucketing logic in `TasksFilterStore`
 * and the column renderers in `TasksTable` actually read — `displayName`,
 * `dueDate`, `isOverdue`, `isSnoozed`, `frequency`, plus the formatted
 * date strings. RRule-aware: `dueDate` is the next-occurrence resolved
 * via `getNextDueDate`, not the stored anchor.
 */
export type CustomTaskItem = {
  type: CustomTaskType;
  key: string;
  dueDate: Date;
  isOverdue: boolean;
  isSnoozed: false;
  dueDateFromToday: string;
  dueDateDisplayLong: string;
  dueDateDisplayShort: string;
  rootStore: RootStore;
  person: Client;
  displayName: string;
  frequency: string;
  /**
   * Original Firestore record. Kept so any future cell renderer needing
   * to inspect e.g. recurrence text or `completedOn` can reach through.
   */
  record: CustomTaskRecord;
};

/**
 * A single row in the Tasks-dashboard table. Either a supervision task or
 * a custom task; the `type` field discriminates between them.
 */
export type TaskTableItem = SupervisionTask | CustomTaskItem;

export type ClientTasksSummary = {
  person: Client;
  tasks: TaskTableItem[];
};

export type TasksRowEntity = TaskTableItem | ClientTasksSummary;

export type SupervisionTaskRecord<T extends SupervisionTaskType> = {
  taskDisplayName: string;
  type: T;
  details: SupervisionDetailsForTask[T];
  dueDate: string;
  // Backend-driven signal for whether this task should surface in the Tasks
  // Route Planner. Defaults to false when absent from the Firestore record.
  includeInRoutePlanner?: boolean;
  // Route-Planner-specific display label. Set by the backend only when
  // includeInRoutePlanner is true; absent otherwise.
  routePlannerDisplayName?: string;
};

export type SupervisionNeed = {
  type: SupervisionNeedType;
};

export type UsTxSimpleContactTaskType =
  | "usTxCollateralContactScheduled"
  | "usTxHomeContactScheduled"
  | "usTxHomeContactUnscheduled"
  | "usTxInCustodyContact"
  | "usTxOfficeContactScheduled"
  | "usTxFieldContactScheduled"
  | "usTxVirtualOfficeContactScheduled"
  | "usTxHomeContactUnscheduledWeekend";

export type UsTxAgnosticContactTaskType =
  | "usTxTypeAgnosticContact"
  | "usTxVirtualOrOfficeContact";

export type UsIdAgnosticTaskType =
  | "usIdFaceToFaceContact"
  | "usIdHomeVisit"
  | "usIdEmploymentVerification"
  | "usIdLsirAssessment"
  | "usIdStableAssessment";

export type TasksStateCode = {
  [K in keyof SpecificTenantConfigs]: SpecificTenantConfigs[K] extends {
    workflowsTasksConfig: WorkflowsTasksConfig;
  }
    ? K
    : never;
}[keyof SpecificTenantConfigs];

type TasksForState = {
  [T in TasksStateCode]: keyof SpecificTenantConfigs[T]["workflowsTasksConfig"]["tasks"];
};

export interface SupervisionTasksRecord<T extends TasksStateCode> {
  externalId: string;
  officerId: string;
  stateCode: T;
  tasks: SupervisionTaskRecord<TasksForState[T]>[];
  needs?: SupervisionNeed[];
}

/**
 * A SupervisionTask is associated with a single client and has a list of tasks.
 */
export interface SupervisionTaskInterface extends Hydratable {
  readonly tasks: SupervisionTask[];
  readonly needs: SupervisionNeed[];
  overdueTasks: SupervisionTask[];
  upcomingTasks: SupervisionTask[];
  orderedTasks: SupervisionTask[];
  readyOrderedTasks: SupervisionTask[];
  tasksConfig?: WorkflowsTasksConfig;
  trackPreviewed: (task: SupervisionTaskCategory) => void;
}
