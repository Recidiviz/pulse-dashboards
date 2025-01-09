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

import { Hydratable } from "~hydration-utils";

import { SnoozeTaskConfig } from "../../core/models/types";
import { RootStore } from "../../RootStore";
import { Expect, Extends } from "../../utils/typeUtils";
import { JusticeInvolvedPerson } from "../types";

export const SUPERVISION_TASKS_TYPES = ["usIdSupervisionTasks"] as const;

export type SupervisionTasksType = (typeof SUPERVISION_TASKS_TYPES)[number];

export type SupervisionTasksCaseType = "GENERAL" | "SEX_OFFENSE";

// TODO: Remove optional lastHomeVisit and lastContacted once it's available in the data
type HomeVisitDetails = {
  caseType: SupervisionTasksCaseType;
  supervisionLevel: string;
  currentAddress: string;
  lastHomeVisit?: string;
};

type AssessmentDetails = {
  riskLevel: string | null;
  lastAssessedOn: string | null;
};

type ContactDetails = {
  caseType: SupervisionTasksCaseType;
  supervisionLevel: string;
  lastContacted?: string;
};

type EmploymentDetails = {
  caseType: SupervisionTasksCaseType;
  supervisionLevel: string;
  lastContacted?: string;
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
  "homeVisit",
  "assessment",
  "contact",
  "employment",
] as const;
export type SupervisionTaskType = (typeof SUPERVISION_TASK_TYPES)[number];
export type SupervisionDetails =
  | HomeVisitDetails
  | AssessmentDetails
  | ContactDetails
  | EmploymentDetails;

export type SupervisionDetailsForTask = {
  homeVisit: HomeVisitDetails;
  assessment: AssessmentDetails;
  contact: ContactDetails;
  employment: EmploymentDetails;
};

export type SupervisionTask<
  T extends SupervisionTaskType = SupervisionTaskType,
> = {
  type: T;
  dueDate: Date;
  details: SupervisionDetailsForTask[T];
  isOverdue: boolean;
  isSnoozed: boolean;
  snoozedUntil?: Date;
  dueDateFromToday: string;
  rootStore: RootStore;
  person: JusticeInvolvedPerson;
  displayName: string;
  dueDateDisplayLong: string;
  dueDateDisplayShort: string;
  additionalDetails?: string;
  updateSupervisionTask: (snoozeForDays?: number) => void;
};

export type SupervisionTaskRecord<T extends SupervisionTaskType> = {
  type: T;
  details: SupervisionDetailsForTask[T];
  dueDate: string;
};

export type SupervisionNeed = {
  type: SupervisionNeedType;
};

export interface SupervisionTasksRecord {
  externalId: string;
  officerId: string;
  stateCode: string;
  tasks: SupervisionTaskRecord<SupervisionTaskType>[];
  needs?: SupervisionNeed[];
}

/**
 * A SupervisionTask is associated with a single client and it has a list of tasks.
 */
export interface SupervisionTaskInterface extends Hydratable {
  readonly tasks: SupervisionTask<SupervisionTaskType>[];
  readonly needs: SupervisionNeed[];
  overdueTasks: SupervisionTask<SupervisionTaskType>[];
  upcomingTasks: SupervisionTask<SupervisionTaskType>[];
  orderedTasks: SupervisionTask<SupervisionTaskType>[];
  readyOrderedTasks: SupervisionTask<SupervisionTaskType>[];
  snoozeTasksConfig?: SnoozeTaskConfig;
  trackPreviewed: () => void;
}
