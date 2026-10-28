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

import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../components/StoreProvider";
import { PUBLIC_CALENDAR_COMPONENTS_BY_TENANT } from "./publicCalendarComponentsByTenant";

/**
 * The Public Calendar Parole subpage. Renders the current tenant's own Public
 * Calendar page, which owns the routes below /parole/public-calendar.
 */
export const ParolePublicCalendar = observer(function ParolePublicCalendar() {
  const { currentTenantId } = useRootStore();

  const StatePublicCalendar = currentTenantId
    ? PUBLIC_CALENDAR_COMPONENTS_BY_TENANT[currentTenantId]
    : undefined;

  if (!StatePublicCalendar) {
    throw new Error(
      `Tenant [${currentTenantId}] has no Parole Public Calendar component.`,
    );
  }

  return <StatePublicCalendar />;
});
