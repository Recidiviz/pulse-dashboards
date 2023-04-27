/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import { isPast } from "date-fns";

import { TaskValidationError } from "../../errors";
import { formatDueDateFromToday } from "../../utils";
import { JusticeInvolvedPerson } from "../types";
import { fieldToDate } from "../utils";
import {
  SupervisionDetailsForTask,
  SupervisionTask,
  SupervisionTaskRecord,
  SupervisionTaskType,
} from "./types";

/**
 * Implements functionality shared by a single task.
 */
export abstract class Task<TaskType extends SupervisionTaskType>
  implements SupervisionTask
{
  task: SupervisionTaskRecord;

  person: JusticeInvolvedPerson;

  type: SupervisionTaskType;

  /* ex: Risk assessment */
  abstract displayName: string;

  /* ex: Risk assessment due 3 days ago */
  abstract dueDateDisplayLong: string;

  /* ex: Due 3 days ago */
  abstract dueDateDisplayShort: string;

  constructor(
    task: SupervisionTaskRecord,
    type: SupervisionTaskType,
    person: JusticeInvolvedPerson
  ) {
    this.task = task;
    this.person = person;

    if (this.task.type !== type) {
      throw new TaskValidationError(
        "Cannot instantiate Task with different supervision task type."
      );
    }
    this.type = type;
  }

  abstract get additionalDetails(): string | undefined;

  get dueDate(): Date {
    return fieldToDate(this.task.dueDate);
  }

  get isOverdue(): boolean {
    return isPast(this.dueDate);
  }

  get dueDateFromToday(): string {
    return formatDueDateFromToday(this.dueDate);
  }

  get details(): SupervisionDetailsForTask[TaskType] {
    // TODO: Figure out how to define this without an assertion
    return this.task.details as SupervisionDetailsForTask[TaskType];
  }
}
