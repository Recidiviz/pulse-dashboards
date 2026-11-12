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

import {
  AnyTRPCRootTypes,
  TRPCBuiltRouter,
  TRPCRouterRecord,
} from "@trpc/server";

import { moduleRouter as calendarRouter } from "~@modules/Calendar/router";
import { moduleRouter as userSettingsRouter } from "~@modules/UserSettings/router";
import { moduleRouter as usTnReclassificationRouter } from "~@modules/UsTnReclassification/router";
import { mergeRouters, router } from "~@modules-server/trpc-base";
import type { ModuleName } from "~module-registry";

type ModuleRouter = TRPCBuiltRouter<AnyTRPCRootTypes, Record<never, never>>;
type ModuleRouters = Partial<Record<ModuleName, ModuleRouter>>;

export const MODULE_ROUTERS = {
  Calendar: calendarRouter,
  UserSettings: userSettingsRouter,
  UsTnReclassification: usTnReclassificationRouter,
} as const satisfies ModuleRouters;

export function registerModuleRouters(
  baseProcedures: TRPCRouterRecord,
  moduleRouters: ModuleRouters,
) {
  return mergeRouters(router(baseProcedures), router(moduleRouters));
}

export type RouterByModule = typeof MODULE_ROUTERS;
