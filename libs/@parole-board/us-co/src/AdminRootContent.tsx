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

import { ReactNode } from "react";

import { StatusMessage } from "~@parole-board/common";

/**
 * Which state the admin root shows: "offline" for offline or demo mode,
 * "notConfigured" when this environment or tenant has no calendar, and
 * "live" for the calendar itself.
 */
export type AdminRootMode = "offline" | "notConfigured" | "live";

/**
 * Presentational body of UsCoParoleCalendarAdmin. Takes no host, so examples
 * can render each mode on its own. Renders children only in "live" mode.
 */
export function AdminRootContent({
  mode,
  children,
}: {
  mode: AdminRootMode;
  children?: ReactNode;
}) {
  switch (mode) {
    case "offline":
      return (
        <StatusMessage title="The Public Calendar needs the calendar server, which doesn't run in offline or demo mode." />
      );
    case "notConfigured":
      return (
        <StatusMessage title="The Public Calendar isn't set up in this environment." />
      );
    case "live":
      return children;
  }
}
