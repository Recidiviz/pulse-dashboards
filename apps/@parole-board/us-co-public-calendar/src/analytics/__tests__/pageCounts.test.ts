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

import { waitFor } from "@testing-library/react";

import {
  createPageCounts,
  PAGE_COUNT_ANONYMOUS_ID,
  PAGE_COUNT_IP,
} from "../pageCounts";

const WRITE_KEY = "test-write-key";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Stands in for Segment's servers: the CDN's source settings, with only the
 * Segment.io destination, and a 200 for every event. Returns the events the
 * page sent, parsed.
 */
function stubSegment() {
  const fetchMock = vi.fn(
    async (url: string | URL | Request, _init?: RequestInit) => {
      const href = url.toString();
      if (href.includes("cdn.segment.com")) {
        return jsonResponse({
          integrations: {
            "Segment.io": { apiKey: WRITE_KEY, apiHost: "api.segment.io/v1" },
          },
        });
      }
      return jsonResponse({ success: true });
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  const sentEvents = () =>
    fetchMock.mock.calls
      .filter(([url]) => url.toString().includes("api.segment.io"))
      .map(
        ([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>,
      );
  return { fetchMock, sentEvents };
}

afterEach(() => {
  document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0].trim())
    .filter(Boolean)
    .forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  localStorage.clear();
});

test("sends a page event with only the month, no IP and no visitor id", async () => {
  const { sentEvents } = stubSegment();
  createPageCounts(WRITE_KEY).page("2026-11");

  await waitFor(() => expect(sentEvents()).toHaveLength(1));
  const [event] = sentEvents();
  expect(event["type"]).toBe("page");
  expect(event["properties"]).toEqual({ month: "2026-11" });
  expect(event["anonymousId"]).toBe(PAGE_COUNT_ANONYMOUS_ID);
  expect(event["userId"] ?? null).toBeNull();
  expect(event["context"]).toEqual({
    ip: PAGE_COUNT_IP,
    library: expect.objectContaining({ name: "analytics.js" }),
  });
});

test("stores nothing on the device", async () => {
  const { sentEvents } = stubSegment();
  createPageCounts(WRITE_KEY).page("2026-11");

  await waitFor(() => expect(sentEvents()).toHaveLength(1));
  expect(document.cookie).toBe("");
  expect(localStorage.length).toBe(0);
});

test("sends nothing without a write key", async () => {
  const { fetchMock } = stubSegment();
  createPageCounts(undefined).page("2026-11");

  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(fetchMock).not.toHaveBeenCalled();
});
