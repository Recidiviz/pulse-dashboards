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

import { makeObservable } from "mobx";

import { SupervisionTaskUpdate } from "../../FirestoreStore";
import { Client } from "../Client";
import { TasksBase } from "./TasksBase";
import { SupervisionTasksRecord } from "./types";

export class UsIdSupervisionTasks extends TasksBase<
  Client,
  SupervisionTasksRecord,
  SupervisionTaskUpdate
> {
  constructor(client: Client) {
    super(client.rootStore, client, "usIdSupervisionTasks");
    makeObservable(this, { needsEmployment: true });
  }

  get needsEmployment(): boolean {
    return (
      this.record?.needs?.map((need) => need.type).includes("employment") ??
      false
    );
  }
}
