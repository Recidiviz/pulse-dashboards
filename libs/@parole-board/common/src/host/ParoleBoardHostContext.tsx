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
import { Link as RouterLink } from "react-router-dom";

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

const ignoreError = () => undefined;

/**
 * Returns the host's reportError, or a no-op outside a ParoleBoardHostProvider
 * or when the host doesn't report errors, so error boundaries can report
 * wherever they render.
 */
export function useReportError(): (error: unknown) => void {
  return useContext(ParoleBoardHostContext)?.reportError ?? ignoreError;
}

/**
 * Returns the link component the calendar's links render: the host's Link,
 * or react-router's when the host has none or outside a
 * ParoleBoardHostProvider.
 */
export function useHostLink(): NonNullable<ParoleBoardHost["Link"]> {
  return useContext(ParoleBoardHostContext)?.Link ?? RouterLink;
}
