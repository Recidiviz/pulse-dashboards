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

import { StateCode } from "~@jii/configs";

import { segment } from "../../../../analytics/segment";
import { caller, mockCtx } from "../../../../test/mockResidentProcedure";
import { resourceApiClient } from "./resourceApiClient";

vi.mock("./resourceApiClient", () => ({
  resourceApiClient: {
    getOrganizations: vi.fn(),
    getOrganization: vi.fn(),
  },
}));

vi.mock("../../../../analytics/segment", () => ({
  segment: {
    trackAnonymousEvent: vi.fn(),
  },
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe("getResources", () => {
  test("passes ctx.stateCode to resourceApiClient", async () => {
    mockCtx.stateCode = "US_NYC";

    await caller.resources.getResources();

    expect(resourceApiClient.getOrganizations).toHaveBeenCalledWith("US_NYC");
  });
});

describe("getResource", () => {
  test("passes organizationId to resourceApiClient", async () => {
    await caller.resources.getResource({ organizationId: 42 });

    expect(resourceApiClient.getOrganization).toHaveBeenCalledWith(42);
  });
});

describe("logSearchQueryAnonymously", () => {
  test("tracks exactly the query, resultCount, and searchSessionId - never the caller's identity", async () => {
    await caller.resources.logSearchQueryAnonymously({
      query: "housing",
      resultCount: 3,
      searchSessionId: "11111111-1111-1111-1111-111111111111",
    });

    expect(segment.trackAnonymousEvent).toHaveBeenCalledExactlyOnceWith(
      "backend_cre_search_query",
      "11111111-1111-1111-1111-111111111111",
      { query: "housing", resultCount: 3, stateCode: "US_XX" },
      { isRecidivizUser: false },
    );

    // mockCtx.pseudonymizedId is populated on every test's ctx (see
    // mockResidentProcedure.ts) precisely so this assertion is meaningful: it
    // fails if this procedure ever starts reading identity off ctx and leaking
    // it into the tracked event.
    const call = vi.mocked(segment.trackAnonymousEvent).mock.calls[0];
    expect(JSON.stringify(call)).not.toContain(mockCtx.pseudonymizedId);
  });

  test("flags the event as Recidiviz-internal when the caller's stateCode is RECIDIVIZ", async () => {
    mockCtx.stateCode = "RECIDIVIZ" as StateCode;

    await caller.resources.logSearchQueryAnonymously({
      query: "housing",
      resultCount: 3,
      searchSessionId: "11111111-1111-1111-1111-111111111111",
    });

    expect(segment.trackAnonymousEvent).toHaveBeenCalledExactlyOnceWith(
      "backend_cre_search_query",
      "11111111-1111-1111-1111-111111111111",
      { query: "housing", resultCount: 3, stateCode: "RECIDIVIZ" },
      { isRecidivizUser: true },
    );
  });

  test("truncates a query longer than 500 characters", async () => {
    await caller.resources.logSearchQueryAnonymously({
      query: "a".repeat(600),
      resultCount: 0,
      searchSessionId: "11111111-1111-1111-1111-111111111111",
    });

    const properties = vi.mocked(segment.trackAnonymousEvent).mock
      .calls[0][2] as { query: string };
    expect(properties.query).toHaveLength(500);
    expect(properties.query).toBe("a".repeat(500));
  });

  test("rejects a searchSessionId that isn't a UUID", async () => {
    await expect(
      caller.resources.logSearchQueryAnonymously({
        query: "housing",
        resultCount: 0,
        searchSessionId: "not-a-uuid",
      }),
    ).rejects.toThrow();
  });
});
