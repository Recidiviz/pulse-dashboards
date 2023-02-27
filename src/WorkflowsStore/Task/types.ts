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

const SUPERVISION_TASKS_TYPES = ["usIdSupervisionTasks"] as const;
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

type SupervisionNeedType = "employment";

export type SupervisionTaskType = "homeVisit" | "assessment" | "contact";
type SupervisionDetails = HomeVisitDetails | AssessmentDetails | ContactDetails;

type SupervisionDetailsForTask = {
  homeVisit: HomeVisitDetails;
  assessment: AssessmentDetails;
  contact: ContactDetails;
};

export type SupervisionTask<T extends SupervisionTaskType> = {
  type: T;
  dueDate: string;
  details: SupervisionDetailsForTask[T];
};

export type SupervisionNeed = {
  type: SupervisionNeedType;
};

export interface SupervisionTasksRecord {
  externalId: string;
  officerId: string;
  stateCode: string;
  tasks: SupervisionTask<SupervisionTaskType>[];
  needs?: SupervisionNeed[];
}

/**
 * A SupervisionTask is associated with a single client and it has a list of tasks.
 */
export interface SupervisionTaskInterface extends Hydratable {
  readonly tasks?: SupervisionTask<SupervisionTaskType>[] | undefined;
  readonly needs?: SupervisionNeed[] | undefined;
  overdueTasks: SupervisionTask<SupervisionTaskType>[];
  upcomingTasks: SupervisionTask<SupervisionTaskType>[];
}
