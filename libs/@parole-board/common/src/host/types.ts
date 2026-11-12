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

import type { ComponentType, RefAttributes } from "react";
import type { LinkProps } from "react-router-dom";

import type { CalendarTrpc } from "../api/client";
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
   * The calendar API client the data hooks read through, built with
   * createCalendarTrpc on the host app's QueryClient. The host renders the
   * calendar under a QueryClientProvider with that same client.
   */
  calendarTrpc: CalendarTrpc;
  /**
   * Reports an error the calendar caught and recovered from, such as a failed
   * load behind a retry, which the host's own error boundary never sees.
   */
  reportError?: (error: unknown) => void;
  /**
   * The host app's link, which the calendar's links render, such as the
   * staff Link that keeps the tenantId in the URL. It takes react-router's
   * LinkProps; without it, the links are react-router's own Link.
   */
  Link?: ComponentType<LinkProps & RefAttributes<HTMLAnchorElement>>;
  /**
   * The public calendar site's address, an https:// origin, which the admin's
   * View public page link opens. The staff app sets it per environment from
   * the build env value VITE_US_CO_PUBLIC_CALENDAR_URL. Without a valid one,
   * the admin shows no View public page link.
   */
  publicCalendarUrl?: string;
}
