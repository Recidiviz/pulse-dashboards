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

import {
  createProviderContext,
  staffCaller,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";

const serviceMocks = vi.hoisted(() => ({
  autocompleteAddressesService: vi.fn(),
  getPlaceDetailsService: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/routes/places/places.service", () => ({
  ...serviceMocks,
}));

const rateLimitMocks = vi.hoisted(() => ({
  assertWithinPlacesRateLimit: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/routes/places/places.rateLimit", () => ({
  ...rateLimitMocks,
}));

const { appRouter } = await import("~@idaho-th/trpc/router");

const SESSION_TOKEN = "11111111-1111-4111-8111-111111111111";
const PREDICTIONS = { predictions: [] };
const DETAILS = { placeId: "place-abc" };

beforeEach(() => {
  serviceMocks.autocompleteAddressesService.mockResolvedValue(PREDICTIONS);
  serviceMocks.getPlaceDetailsService.mockResolvedValue(DETAILS);
});

describe("places router authorization", () => {
  it.each(["autocompleteAddresses", "getPlaceDetails"] as const)(
    "rejects a provider caller on %s",
    async (procedure) => {
      const caller = appRouter.createCaller(createProviderContext());
      const input =
        procedure === "autocompleteAddresses"
          ? { input: "123 Main St" }
          : { placeId: "place-abc" };

      await expect(
        caller.places[procedure](input as never),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      expect(rateLimitMocks.assertWithinPlacesRateLimit).not.toHaveBeenCalled();
      expect(serviceMocks.autocompleteAddressesService).not.toHaveBeenCalled();
      expect(serviceMocks.getPlaceDetailsService).not.toHaveBeenCalled();
    },
  );
});

describe("places router input validation", () => {
  it.each([
    ["a missing input", {}],
    ["an empty input", { input: "" }],
    ["a whitespace-only input", { input: "   " }],
    ["an over-long input", { input: "x".repeat(501) }],
    ["a non-uuid session token", { input: "123 Main St", sessionToken: "abc" }],
  ])("rejects %s on autocompleteAddresses", async (_label, input) => {
    await expect(
      staffCaller().places.autocompleteAddresses(input as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(serviceMocks.autocompleteAddressesService).not.toHaveBeenCalled();
  });

  it.each([
    ["a missing placeId", {}],
    ["an empty placeId", { placeId: "" }],
    ["an over-long placeId", { placeId: "x".repeat(501) }],
    ["a non-uuid session token", { placeId: "place-abc", sessionToken: "abc" }],
  ])("rejects %s on getPlaceDetails", async (_label, input) => {
    await expect(
      staffCaller().places.getPlaceDetails(input as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(serviceMocks.getPlaceDetailsService).not.toHaveBeenCalled();
  });

  it("trims the validated input before handing it on", async () => {
    await staffCaller().places.autocompleteAddresses({
      input: "  123 Main St  ",
    });

    expect(
      serviceMocks.autocompleteAddressesService.mock.calls[0]?.[0],
    ).toEqual({ input: "123 Main St", sessionToken: undefined });
  });
});

describe("places router happy path", () => {
  it("rate limits before calling the service", async () => {
    rateLimitMocks.assertWithinPlacesRateLimit.mockImplementation(() => {
      expect(serviceMocks.autocompleteAddressesService).not.toHaveBeenCalled();
    });

    await expect(
      staffCaller().places.autocompleteAddresses({ input: "123 Main St" }),
    ).resolves.toEqual(PREDICTIONS);

    expect(rateLimitMocks.assertWithinPlacesRateLimit).toHaveBeenCalledWith(
      TEST_STAFF_PSEUDONYMIZED_ID,
    );
  });

  it("does not call the service when the rate limiter rejects", async () => {
    rateLimitMocks.assertWithinPlacesRateLimit.mockImplementation(() => {
      throw new Error("rate limited");
    });

    await expect(
      staffCaller().places.autocompleteAddresses({ input: "123 Main St" }),
    ).rejects.toThrow();
    expect(serviceMocks.autocompleteAddressesService).not.toHaveBeenCalled();
  });

  it("forwards the procedure meta for each procedure", async () => {
    await staffCaller().places.autocompleteAddresses({
      input: "123 Main St",
      sessionToken: SESSION_TOKEN,
    });
    await staffCaller().places.getPlaceDetails({ placeId: "place-abc" });

    expect(
      serviceMocks.autocompleteAddressesService.mock.calls[0]?.[1],
    ).toEqual({
      traceId: "test-request-id",
      procedureName: "places.autocompleteAddresses",
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });
    expect(serviceMocks.getPlaceDetailsService.mock.calls[0]?.[1]).toEqual({
      traceId: "test-request-id",
      procedureName: "places.getPlaceDetails",
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });
  });

  it("falls back to an unknown trace id", async () => {
    const caller = staffCaller({
      req: {
        log: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
      },
    } as never);

    await caller.places.getPlaceDetails({ placeId: "place-abc" });

    expect(
      serviceMocks.getPlaceDetailsService.mock.calls[0]?.[1],
    ).toMatchObject({ traceId: "unknown" });
  });
});
