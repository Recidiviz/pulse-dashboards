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

import { captureException } from "@sentry/react";

import type { ParoleBoardHost } from "~@parole-board/common";

import type { RootStore } from "../../../RootStore";
import { createParoleBoardAnalytics } from "./createParoleBoardAnalytics";

/**
 * Builds the ParoleBoardHost the Parole Board libraries read from the staff
 * RootStore. currentTenantId is a getter so the host keeps tracking the
 * tenant the user switches to, and MobX observers inside the library
 * re-render on that change. Errors the calendar catches and recovers from go
 * to Sentry, which the page's own error boundary would otherwise never see.
 */
export function createParoleBoardHost(rootStore: RootStore): ParoleBoardHost {
  return {
    get currentTenantId() {
      return rootStore.currentTenantId;
    },
    userStore: rootStore.userStore,
    tenantStore: rootStore.tenantStore,
    analyticsStore: createParoleBoardAnalytics(rootStore.analyticsStore),
    reportError: (error) => {
      captureException(error);
    },
  };
}
