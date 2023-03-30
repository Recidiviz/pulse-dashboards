// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { Hydratable } from "../../core/models/types";
import { Expect, Extends } from "../../utils/typeUtils";
import { JusticeInvolvedPerson } from "../types";

export const SUPERVISION_TASKS_TYPES = ["usIdSupervisionTasks"] as const;

export type SupervisionTasksType = typeof SUPERVISION_TASKS_TYPES[number];

type HomeVisitDetails = {
  supervisionLevel: string;
  currentAddress: string;
};

type AssessmentDetails = {
  riskLevel: string;
  lastAssessedOn: Date;
};

type ContactDetails = {
  supervisionLevel: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CheckSupervisionTaskDetailsMappingType = Expect<
  Extends<
    SupervisionDetailsForTask,
    Record<SupervisionTaskType, SupervisionDetails>
  >
>;

export const SUPERVISION_NEED_TYPES = ["employment"] as const;

export type SupervisionNeedType = typeof SUPERVISION_NEED_TYPES[number];

export const SUPERVISION_TASK_TYPES = [
  "homeVisit",
  "assessment",
  "contact",
] as const;
export type SupervisionTaskType = typeof SUPERVISION_TASK_TYPES[number];
type SupervisionDetails = HomeVisitDetails | AssessmentDetails | ContactDetails;

type SupervisionDetailsForTask = {
  homeVisit: HomeVisitDetails;
  assessment: AssessmentDetails;
  contact: ContactDetails;
};

export type SupervisionTask<
  T extends SupervisionTaskType = SupervisionTaskType
> = {
  type: T;
  dueDate: Date;
  details: SupervisionDetailsForTask[T];
  isOverdue: boolean;
  dueDateFromToday: string;
  person: JusticeInvolvedPerson;
};

export type SupervisionTaskRecord = Pick<
  SupervisionTask,
  "type" | "details"
> & {
  dueDate: string;
};

export type SupervisionNeed = {
  type: SupervisionNeedType;
};

export interface SupervisionTasksRecord {
  externalId: string;
  officerId: string;
  stateCode: string;
  tasks: SupervisionTaskRecord[];
  needs?: SupervisionNeed[];
}

/**
 * A SupervisionTask is associated with a single client and it has a list of tasks.
 */
export interface SupervisionTaskInterface extends Hydratable {
  readonly tasks: SupervisionTask[];
  readonly needs: SupervisionNeed[];
  overdueTasks: SupervisionTask[];
  upcomingTasks: SupervisionTask[];
  orderedTasks: SupervisionTask[];
  trackPreviewed: () => void;
}
