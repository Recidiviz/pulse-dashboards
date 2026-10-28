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

import { useEffect } from "react";

import {
  ParoleBoardHost,
  ParoleBoardHostProvider,
} from "~@parole-board/common";
import { isDemoMode, isOfflineMode } from "~client-env-utils";

import { AdminRootContent, AdminRootMode } from "./AdminRootContent";

function getAdminRootMode(host: ParoleBoardHost): AdminRootMode {
  if (isOfflineMode() || isDemoMode()) return "offline";
  if (
    !import.meta.env["VITE_MODULE_BACKEND_URL"] ||
    !host.tenantStore.currentTenantConfig?.calendarConfig
  ) {
    return "notConfigured";
  }
  return "live";
}

/**
 * The US_CO Parole Board calendar admin tool. The host app mounts it on a
 * route ending in "/*"; the routes inside it are relative. It sends no request
 * in offline or demo mode, or when the calendar isn't configured.
 */
export function UsCoParoleCalendarAdmin({ host }: { host: ParoleBoardHost }) {
  const mode = getAdminRootMode(host);
  const tenantId = host.currentTenantId;

  useEffect(() => {
    if (mode === "notConfigured") {
      console.warn(
        `Public Calendar is not configured for tenant ${tenantId ?? "(none)"}: it needs VITE_MODULE_BACKEND_URL and a calendarConfig`,
      );
    }
  }, [mode, tenantId]);

  return (
    <ParoleBoardHostProvider host={host}>
      <AdminRootContent mode={mode}>
        <p>This page is being built.</p>
      </AdminRootContent>
    </ParoleBoardHostProvider>
  );
}
