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

import { WorkflowsTasksConfig } from "../../core/models/types";
import { SupervisionTaskUpdate } from "../../FirestoreStore";
import { RootStore } from "../../RootStore";
import { Expect, Extends } from "../../utils/typeUtils";
import { Client } from "../Client";
import { JusticeInvolvedPerson } from "../types";
import { TasksBase } from "./TasksBase";

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

type UsTxContactDetails = {
  contactCount: number;
  lastContactDate: string | null;
  overdueFlag: boolean;
  typeOfContact: string;
  frequency: string;
};

type UsTxTypeAgnosticContactDetails = {
  contactDueDate: string;
  frequency: string;
  lastContactDate: string | null;
  overdueFlag: boolean;
  contactTypesAccepted: string;
};

type UsTxEdgeCaseContactDetails = {
  reasonForContact: string;
};

type UsTxAssessmentDetails = {
  eventType: string;
  dueAssessmentDate: string | null;
  eventDate: string;
  frequency: string;
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
  "usTxTypeAgnosticContact",
  "usTxCollateralContactScheduled",
  "usTxHomeContactScheduled",
  "usTxHomeContactUnscheduled",
  "usTxHomeContactEdgeCase",
  "usTxFieldContactScheduled",
  "usTxFieldContactUnscheduled",
  "usTxElectronicContactScheduled",
  "usTxElectronicContactUnscheduled",
  "usTxAssessment",
] as const;

export type SupervisionTaskType = (typeof SUPERVISION_TASK_TYPES)[number];
export type SupervisionDetails =
  | UsIdHomeVisitDetails
  | UsIdAssessmentDetails
  | UsIdContactDetails
  | UsIdEmploymentDetails
  | UsTxContactDetails
  | UsTxTypeAgnosticContactDetails
  | UsTxEdgeCaseContactDetails
  | UsTxAssessmentDetails;

export type SupervisionDetailsForTask = {
  homeVisit: UsIdHomeVisitDetails;
  assessment: UsIdAssessmentDetails;
  contact: UsIdContactDetails;
  employment: UsIdEmploymentDetails;
  usTxCollateralContactScheduled: UsTxContactDetails;
  usTxTypeAgnosticContact: UsTxTypeAgnosticContactDetails;
  usTxHomeContactScheduled: UsTxContactDetails;
  usTxHomeContactUnscheduled: UsTxContactDetails;
  usTxHomeContactEdgeCase: UsTxEdgeCaseContactDetails;
  usTxFieldContactScheduled: UsTxContactDetails;
  usTxFieldContactUnscheduled: UsTxContactDetails;
  usTxElectronicContactScheduled: UsTxContactDetails;
  usTxElectronicContactUnscheduled: UsTxContactDetails;
  usTxAssessment: UsTxAssessmentDetails;
};

export type SupervisionTask<
  T extends SupervisionTaskType = SupervisionTaskType,
> = {
  type: T;
  key: string;
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
  frequency: string;
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

export type TasksStateCode = "US_ID" | "US_TX";

export type UsTxSimpleContactTaskType =
  | "usTxCollateralContactScheduled"
  | "usTxHomeContactScheduled"
  | "usTxHomeContactUnscheduled"
  | "usTxFieldContactScheduled"
  | "usTxFieldContactUnscheduled"
  | "usTxElectronicContactScheduled"
  | "usTxElectronicContactUnscheduled";

// TODO: Derive these from tenant configs
type TasksForState = {
  US_ID: "homeVisit" | "assessment" | "contact" | "employment";
  US_TX:
    | UsTxSimpleContactTaskType
    | "usTxTypeAgnosticContact"
    | "usTxHomeContactEdgeCase"
    | "usTxAssessment";
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
  trackPreviewed: () => void;
}

export class SupervisionTasks<T extends TasksStateCode> extends TasksBase<
  Client,
  SupervisionTasksRecord<T>,
  SupervisionTaskUpdate
> {
  constructor(stateCode: T, client: Client) {
    const {
      rootStore,
      rootStore: {
        tenantStore: { tasksConfiguration },
      },
    } = client;

    if (!tasksConfiguration) {
      throw new Error(
        `State ${stateCode} missing taskConfiguration in TenantConfig`,
      );
    }

    super(rootStore, client, tasksConfiguration);
  }
}
