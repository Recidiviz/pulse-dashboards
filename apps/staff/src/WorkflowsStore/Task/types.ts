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

import { z } from "zod";

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
import type { Client } from "../Client";

const supervisionTasksCaseTypeSchema = z.enum(["GENERAL", "SEX_OFFENSE"]);
export type SupervisionTasksCaseType = z.infer<
  typeof supervisionTasksCaseTypeSchema
>;

// TODO: Remove optional lastHomeVisit and lastContacted once it's available in the data
const usIdHomeVisitDetailsSchema = z.object({
  caseType: supervisionTasksCaseTypeSchema,
  supervisionLevel: z.string(),
  currentAddress: z.string(),
  lastHomeVisit: z.string().optional(),
});

const usIdAssessmentDetailsSchema = z.object({
  riskLevel: z.string().nullable(),
  lastAssessedOn: z.string().nullable(),
});

const usIdContactDetailsSchema = z.object({
  caseType: supervisionTasksCaseTypeSchema,
  supervisionLevel: z.string(),
  lastContacted: z.string().optional(),
});

const usIdEmploymentDetailsSchema = z.object({
  caseType: supervisionTasksCaseTypeSchema,
  supervisionLevel: z.string(),
  lastContacted: z.string().optional(),
});

const usMoTaskDetailsSchema = z.object({
  contactCadence: z.string(),
  lastContactDate: z.string().nullable(),
});

const usMoInitialTaskDetailsSchema = z.object({
  contactCadence: z.string(),
});

const usMoHomeVisitTaskDetailsSchema = usMoTaskDetailsSchema.extend({
  supplementaryContacts: z.array(
    z.object({
      contactTypes: z.string(),
      contactDate: z.string(),
    }),
  ),
});

// ND doesn't use line staff-facing tasks currently, so tasks don't have
// details. Not `.strict()` — an additive backend field here shouldn't drop
// the task, matching the tolerant-of-extra-fields behavior every other
// schema in this file gets by default.
const usNdEmptyDetailsSchema = z.object({});

const usNeAssessmentDetailsSchema = z.object({
  assessmentDueDate: z.string().nullable(),
  mostRecentAssessmentDate: z.string().nullable(),
  isFirstAssessment: z.boolean(),
});

const usNeContactDetailsSchema = z.object({
  contactCadence: z.string(),
  contactCount: z.number(),
  contactDueDate: z.string(),
  lastContactDate: z.string().nullable(),
  overdueFlag: z.boolean(),
  periodType: z.string(),
  typeOfContact: z.string(),
});

const usTxContactDetailsSchema = z.object({
  contactCount: z.number(),
  lastContactDate: z.string().nullable(),
  overdueFlag: z.boolean(),
  typeOfContact: z.string(),
  contactCadence: z.string(),
  scheduledContactDates: z.string().nullable(),
});

const usTxOverridableContactDetailsSchema = usTxContactDetailsSchema.extend({
  overrideContactType: z
    .union([
      z.literal("SCHEDULED HOME (VIRTUAL)"),
      z.literal("UNSCHEDULED HOME (VIRTUAL)"),
    ])
    .nullable(),
  officerInCriticallyUnderstaffedLocation: z.boolean(),
});

const usTxTypeAgnosticContactDetailsSchema = z.object({
  contactDueDate: z.string(),
  contactCadence: z.string(),
  lastContactDate: z.string().nullable(),
  overdueFlag: z.boolean(),
  contactTypesAccepted: z.string(),
  officerInCriticallyUnderstaffedLocation: z.boolean(),
  overrideContactTypesAccepted: z.string(),
  scheduledContactDates: z.string().nullable(),
});

const usTxEdgeCaseContactDetailsSchema = z.object({
  contactCadence: z.string(),
  scheduledContactDates: z.string().nullable(),
  causalDate: z.string(),
  // raw trigger, e.g. US_TX_MEETS_ADDRESS_CHANGE_HOME_CONTACT_TRIGGER
  criteriaName: z.string(),
});

const usTxNewArrivalContactDetailsSchema = z.object({
  contactCadence: z.string(),
  lastContactDate: z.string().nullable(),
  causalDate: z.string(),
});

const usTxAssessmentDetailsSchema = z.object({
  eventType: z.string(),
  dueAssessmentDate: z.string().nullable(),
  eventDate: z.string(),
  frequency: z.string(),
  contactCadence: z.string(),
  dueAssessmentType: z.string().optional().nullable(),
});

const usIdTaskBaseDetailsSchema = z.object({
  contactCadence: z.string(),
  lastContactDate: z.string().nullable(),
  contactPeriodStart: z.string().optional().nullable(),
  contactPeriodEnd: z.string().optional().nullable(),
});

const usIdLsirAssessmentDetailsSchema = usIdTaskBaseDetailsSchema.extend({
  lastAssessmentDate: z.string().nullable(),
});

const usIdStableAssessmentDetailsSchema = usIdTaskBaseDetailsSchema.extend({
  lastAssessmentDate: z.string().nullable(),
});

const usIdHomeVisitOrAddressChangeDetailsSchema =
  usIdTaskBaseDetailsSchema.extend({
    addressChangeContactDueDate: z.string().nullable(),
    addressChangeDate: z.string().nullable(),
  });

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
  "usTxNewArrivalContact",
  "usTxAssessment",
  "usTxHomeContactUnscheduledWeekend",
] as const;

export type SupervisionTaskType = (typeof SUPERVISION_TASK_TYPES)[number];

export type SnoozeOptions = number | "FOREVER";

// Maps each task type to the Zod schema for its `details` payload. The
// `satisfies` clause guarantees every `SupervisionTaskType` has an entry
// (and only valid types have entries).
const detailsSchemaForTaskType = {
  // TODO(#10615): Remove 'homeVisit' v1 (keep v2, usIdHomeVisit) task type when UsIdTasksV2 is fully rolled out.
  homeVisit: usIdHomeVisitDetailsSchema,
  usIdHomeVisit: usIdHomeVisitOrAddressChangeDetailsSchema,
  // TODO(#10615): Remove 'assessment' v1 (keep v2, usIdRiskAssessment) task type when UsIdTasksV2 is fully rolled out.
  assessment: usIdAssessmentDetailsSchema,
  // TODO(#10615): Remove 'contact' v1 (keep v2, UsIdFaceToFaceContact) task type when UsIdTasksV2 is fully rolled out.
  usIdLsirAssessment: usIdLsirAssessmentDetailsSchema,
  usIdStableAssessment: usIdStableAssessmentDetailsSchema,
  contact: usIdContactDetailsSchema,
  // TODO(#10615): Remove 'employment' v1 (keep v2, usIdEmploymentVerification) task type when UsIdTasksV2 is fully rolled out.
  usIdFaceToFaceContact: usIdTaskBaseDetailsSchema,
  employment: usIdEmploymentDetailsSchema,
  usIdEmploymentVerification: usIdTaskBaseDetailsSchema,
  usMoPositiveHomeVisit: usMoHomeVisitTaskDetailsSchema,
  usMoEmploymentVerification: usMoTaskDetailsSchema,
  usMoInitialEmploymentVerificationIap: usMoInitialTaskDetailsSchema,
  usMoInitialPositiveContactWithSignificantOtherIap:
    usMoInitialTaskDetailsSchema,
  usMoInitialPositiveContactWithSignificantOtherSmi:
    usMoInitialTaskDetailsSchema,
  usMoInitialPositiveHomeVisitIap: usMoInitialTaskDetailsSchema,
  usMoInitialPositiveHomeVisitSmi: usMoInitialTaskDetailsSchema,
  usMoInPersonContact: usMoTaskDetailsSchema,
  usMoPositiveContactWithSignificantOther: usMoTaskDetailsSchema,
  usNdContact: usNdEmptyDetailsSchema,
  usNdRiskAssessment: usNdEmptyDetailsSchema,
  usNeOrasAssessment: usNeAssessmentDetailsSchema,
  usNeStableAssessment: usNeAssessmentDetailsSchema,
  usNePersonalContact: usNeContactDetailsSchema,
  usNeCollateralContact: usNeContactDetailsSchema,
  usNeNCJISCheckContact: usNeContactDetailsSchema,
  usTxCollateralContactScheduled: usTxContactDetailsSchema,
  usTxTypeAgnosticContact: usTxTypeAgnosticContactDetailsSchema,
  usTxHomeContactScheduled: usTxOverridableContactDetailsSchema,
  usTxHomeContactUnscheduled: usTxOverridableContactDetailsSchema,
  usTxHomeContactEdgeCase: usTxEdgeCaseContactDetailsSchema,
  usTxInCustodyContact: usTxContactDetailsSchema,
  usTxOfficeContactScheduled: usTxContactDetailsSchema,
  usTxFieldContactScheduled: usTxContactDetailsSchema,
  usTxVirtualOfficeContactScheduled: usTxContactDetailsSchema,
  usTxVirtualOrOfficeContact: usTxTypeAgnosticContactDetailsSchema,
  usTxNewArrivalContact: usTxNewArrivalContactDetailsSchema,
  usTxAssessment: usTxAssessmentDetailsSchema,
  usTxHomeContactUnscheduledWeekend: usTxOverridableContactDetailsSchema,
} satisfies Record<SupervisionTaskType, z.ZodTypeAny>;

export type SupervisionDetailsForTask = {
  [T in SupervisionTaskType]: z.infer<(typeof detailsSchemaForTaskType)[T]>;
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

// Built once per task type rather than per call — both to avoid rebuilding
// identical Zod schemas on every task validated, and because asking the
// compiler to verify a generically-indexed z.object() against
// `SupervisionTaskRecord<T>` for a live type parameter T is prohibitively
// expensive (it forces distribution over every branch of
// `detailsSchemaForTaskType` at once). The cast below is a single, cheap
// assertion instead.
const supervisionTaskRecordSchemaForTaskType = Object.fromEntries(
  SUPERVISION_TASK_TYPES.map((type) => [
    type,
    z.object({
      taskDisplayName: z.string(),
      type: z.literal(type),
      details: detailsSchemaForTaskType[type],
      dueDate: z.string(),
      includeInRoutePlanner: z.boolean().optional(),
      routePlannerDisplayName: z.string().optional().nullable(),
    }),
  ]),
) as unknown as Record<SupervisionTaskType, z.ZodTypeAny>;

/**
 * Returns the Zod schema for a single `SupervisionTaskRecord`, keyed to the
 * `details` shape for the given task type. Used by `TasksBase` to validate
 * one task at a time, so a single malformed task can be dropped (and
 * reported to Sentry) without invalidating the rest of the person's tasks.
 */
export function supervisionTaskRecordSchema<T extends SupervisionTaskType>(
  type: T,
): z.ZodType<SupervisionTaskRecord<T>> {
  return supervisionTaskRecordSchemaForTaskType[type] as z.ZodType<
    SupervisionTaskRecord<T>
  >;
}

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
