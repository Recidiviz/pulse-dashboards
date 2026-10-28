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

import type { ParoleBoardAnalytics } from "./analytics";

/** The calendar a tenant shows, and the label its nav link uses. */
export interface CalendarConfig {
  calendarCode: string;
  navTitle: string;
}

/**
 * Services the Parole Board calendar needs from the app hosting it.
 *
 * Structural on purpose: the host app builds one from its own stores, so these
 * libraries never import the host app. Add a field only when a component
 * needs it.
 */
export interface ParoleBoardHost {
  currentTenantId?: string;
  userStore: {
    // Optional, and may return undefined, to match the staff UserStore, which
    // sets getToken only once Auth0 has loaded.
    getToken?: () => Promise<string> | undefined;
    stateCode: string;
  };
  tenantStore: {
    currentTenantConfig?: {
      calendarConfig?: CalendarConfig;
    };
  };
  analyticsStore: ParoleBoardAnalytics;
  /**
   * Reports an error the calendar caught and recovered from, such as a failed
   * load behind a retry, which the host's own error boundary never sees.
   */
  reportError?: (error: unknown) => void;
}
