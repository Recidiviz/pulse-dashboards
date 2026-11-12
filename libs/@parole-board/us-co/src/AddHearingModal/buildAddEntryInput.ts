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

import type { CalendarRouterInputs, KindDto } from "~@parole-board/common";

import { facilityKind, parseChoice } from "./hearingChoices";

export type AddEntryInput = CalendarRouterInputs["admin"]["entries"]["add"];

/**
 * The entries.add input for the dialog's choice on date, "YYYY-MM-DD": a
 * facility adds the kind that requires a resource with that resource, and a
 * board session adds its own kind with no resource. Kind codes come from the
 * calendar config, never a constant. Returns null when choice names no
 * kind in kinds, so nothing is sent.
 */
export function buildAddEntryInput({
  monthId,
  date,
  choice,
  kinds,
}: {
  monthId: string;
  date: string;
  choice: string;
  kinds: readonly KindDto[];
}): AddEntryInput | null {
  const parsed = parseChoice(choice);
  if (!parsed) return null;

  if (parsed.type === "facility") {
    const kind = facilityKind(kinds);
    return kind
      ? { monthId, date, kindCode: kind.code, resourceId: parsed.resourceId }
      : null;
  }

  const kind = kinds.find(
    ({ code, requiresResource }) =>
      code === parsed.kindCode && !requiresResource,
  );
  return kind ? { monthId, date, kindCode: kind.code, resourceId: null } : null;
}
