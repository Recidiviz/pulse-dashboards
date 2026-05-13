// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import type { SupervisionTaskUpdate } from "../../FirestoreStore";
import { Client } from "../Client";
import { TasksBase } from "./TasksBase";
import type { SupervisionTasksRecord, TasksStateCode } from "./types";

// Concrete SupervisionTasks class. Lives in its own file (not Task/types.ts)
// so types.ts can stay free of the TasksBase import — TasksBase eagerly
// loads tenants/index.ts, which in turn loads every Task subclass and
// would otherwise re-enter types.ts during a runtime evaluation cycle.
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
