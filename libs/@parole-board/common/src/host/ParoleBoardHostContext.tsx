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

import { createContext, ReactNode, useContext } from "react";

import { ParoleBoardHost } from "./types";

const ParoleBoardHostContext = createContext<ParoleBoardHost | undefined>(
  undefined,
);

export function ParoleBoardHostProvider({
  host,
  children,
}: {
  host: ParoleBoardHost;
  children: ReactNode;
}) {
  return (
    <ParoleBoardHostContext.Provider value={host}>
      {children}
    </ParoleBoardHostContext.Provider>
  );
}

/** Returns the host passed to the nearest ParoleBoardHostProvider. */
export function useParoleBoardHost(): ParoleBoardHost {
  const host = useContext(ParoleBoardHostContext);
  if (!host) {
    throw new Error(
      "useParoleBoardHost must be used inside a ParoleBoardHostProvider",
    );
  }
  return host;
}

/**
 * Returns the calendar code from the current tenant's calendarConfig, which
 * every calendar request is scoped to. Throws when the tenant has no
 * calendarConfig, so components only render under a configured tenant.
 */
export function useCalendarCode(): string {
  const { currentTenantId, tenantStore } = useParoleBoardHost();
  const calendarCode =
    tenantStore.currentTenantConfig?.calendarConfig?.calendarCode;
  if (!calendarCode) {
    throw new Error(
      `Tenant ${currentTenantId ?? "(none)"} has no calendarConfig`,
    );
  }
  return calendarCode;
}

const ignoreError = () => undefined;

/**
 * Returns the host's reportError, or a no-op outside a ParoleBoardHostProvider
 * or when the host doesn't report errors, so error boundaries can report
 * wherever they render.
 */
export function useReportError(): (error: unknown) => void {
  return useContext(ParoleBoardHostContext)?.reportError ?? ignoreError;
}
