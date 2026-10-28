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

import type { RootStore } from "../../../../RootStore";
import { createParoleBoardHost } from "../createParoleBoardHost";

vi.mock("@sentry/react", () => ({ captureException: vi.fn() }));

describe("createParoleBoardHost", () => {
  it("reads currentTenantId from the root store on each access", () => {
    const rootStore = {
      currentTenantId: "US_CO",
      userStore: {},
      tenantStore: {},
      analyticsStore: {},
    } as unknown as RootStore;
    const host = createParoleBoardHost(rootStore);

    (rootStore as { currentTenantId: string }).currentTenantId = "US_ID";

    expect(host.currentTenantId).toBe("US_ID");
  });

  it("sends the calendar's analytics events through the root store's AnalyticsStore", () => {
    const track = vi.fn();
    const host = createParoleBoardHost({
      analyticsStore: { track },
    } as unknown as RootStore);

    host.analyticsStore.trackPbPublicCalendarMonthUnpublished({
      year: 2026,
      month: 11,
    });

    expect(track).toHaveBeenCalledWith(
      "frontend.pb_public_calendar_month_unpublished",
      { year: 2026, month: 11 },
    );
  });

  it("reports the errors the calendar catches to Sentry", () => {
    const host = createParoleBoardHost({} as RootStore);
    const error = new Error("Network error");

    host.reportError?.(error);

    expect(captureException).toHaveBeenCalledWith(error);
  });
});
