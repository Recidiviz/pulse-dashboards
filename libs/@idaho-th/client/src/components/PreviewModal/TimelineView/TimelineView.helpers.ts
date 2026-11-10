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

import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "~@idaho-th/trpc-types";

export type TimelineEventItem =
  inferRouterOutputs<AppRouter>["timeline"]["getForStaff"]["events"][number];

type ActorRole = TimelineEventItem["actorRole"];

export function formatActorRole(actorRole: ActorRole): string {
  switch (actorRole) {
    case "STAFF":
      return "Case Manager";
    case "PROVIDER":
      return "Provider";
    case "SYSTEM":
      return "System";
    default:
      return actorRole;
  }
}
