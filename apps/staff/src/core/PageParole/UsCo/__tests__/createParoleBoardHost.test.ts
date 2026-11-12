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

import { queryClient } from "../../../../reactQuery/client";
import type { RootStore } from "../../../../RootStore";
import { Link } from "../../../Link";
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

  it("gives the calendar the staff Link, which keeps the tenantId in the URL", () => {
    const host = createParoleBoardHost({} as RootStore);

    expect(host.Link).toBe(Link);
  });

  it("gives the calendar the public calendar address from VITE_US_CO_PUBLIC_CALENDAR_URL", () => {
    vi.stubEnv(
      "VITE_US_CO_PUBLIC_CALENDAR_URL",
      "https://public-calendar.test",
    );
    const host = createParoleBoardHost({} as RootStore);

    expect(host.publicCalendarUrl).toBe("https://public-calendar.test");
  });

  it("builds the calendar client on the staff QueryClient, with the user's current token and tenant", async () => {
    vi.stubEnv("VITE_MODULE_BACKEND_URL", "https://modules.example.test");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("stop after the request is built"));
    const userStore = {
      getToken: vi.fn(() => Promise.resolve("token-a")),
    };
    const rootStore = { userStore, currentTenantId: "US_CO" };
    const host = createParoleBoardHost(rootStore as unknown as RootStore);

    userStore.getToken.mockResolvedValue("token-b");
    rootStore.currentTenantId = "US_ID";
    await host.calendarTrpc.client.admin.config.get
      .query()
      .catch(() => undefined);

    expect(host.calendarTrpc.queryClient).toBe(queryClient);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toMatch(
      /^https:\/\/modules\.example\.test\/Calendar\.usCo\.paroleBoard\.admin\.config\.get/,
    );
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-b");
    expect(headers.get("StateCode")).toBe("US_ID");
  });

  it("sends no calendar request before Auth0 gives UserStore a getToken", async () => {
    vi.stubEnv("VITE_MODULE_BACKEND_URL", "https://modules.example.test");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const host = createParoleBoardHost({
      userStore: {},
    } as unknown as RootStore);

    await expect(
      host.calendarTrpc.client.admin.config.get.query(),
    ).rejects.toThrow("The calendar needs a signed-in user");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
