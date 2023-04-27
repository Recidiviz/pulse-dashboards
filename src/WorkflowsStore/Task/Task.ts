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

import { formatDueDateFromToday } from "../../utils";
import { JusticeInvolvedPerson } from "../types";
import { fieldToDate } from "../utils";
import {
  SupervisionDetails,
  SupervisionTask,
  SupervisionTaskRecord,
  SupervisionTaskType,
} from "./types";

/**
 * Implements functionality shared by a single task.
 */
export abstract class Task implements SupervisionTask {
  task: SupervisionTaskRecord;

  person: JusticeInvolvedPerson;

  abstract displayName: string;

  constructor(task: SupervisionTaskRecord, person: JusticeInvolvedPerson) {
    this.task = task;
    this.person = person;
  }

  get type(): SupervisionTaskType {
    return this.task.type;
  }

  get dueDate(): Date {
    return fieldToDate(this.task.dueDate);
  }

  get isOverdue(): boolean {
    return isPast(this.dueDate);
  }

  get dueDateFromToday(): string {
    return formatDueDateFromToday(this.dueDate);
  }

  get details(): SupervisionDetails {
    return this.task.details;
  }
}
