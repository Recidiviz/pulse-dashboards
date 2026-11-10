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

import type { ProviderDetails } from "../../hooks/housingApplication";
import {
  createOptimisticHousingProviderUpdate,
  createOptimisticLocationUpdate,
  createOptimisticProfileUpdate,
} from "../optimisticProviderDetails";

function createQueryUtils(initial: ProviderDetails) {
  let data: ProviderDetails | undefined = initial;
  return {
    cancel: vi.fn(async () => undefined),
    getData: vi.fn(() => data),
    setData: vi.fn(
      (
        updater:
          | ProviderDetails
          | undefined
          | ((old: ProviderDetails | undefined) => ProviderDetails | undefined),
      ) => {
        data = typeof updater === "function" ? updater(data) : updater;
      },
    ),
    getLatest: () => data,
  };
}

const PROVIDER: ProviderDetails = {
  housingProviderName: "Acme Housing",
  contactName: "Jane Doe",
  contactEmail: "contact@acmehousing.org",
  contactPhone: "555-0100",
  locations: [
    {
      id: "loc-1",
      streetAddress: "123 Main St",
      city: "Boise",
      state: "ID",
      zip: "83702",
      district: "D1",
      acceptedGenders: ["ALL"],
      acceptsRiders: true,
      acceptsSexOffenders: false,
      acceptsViolentCriminals: false,
      faithBased: false,
    },
  ],
};

describe("createOptimisticHousingProviderUpdate", () => {
  it("writes the new provider name and leaves personal details alone", async () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticHousingProviderUpdate(queryUtils);

    const context = await handlers.onMutate({
      housingProviderName: "Renamed Housing",
    });

    expect(queryUtils.cancel).toHaveBeenCalled();
    expect(queryUtils.getLatest()).toMatchObject({
      housingProviderName: "Renamed Housing",
      contactName: "Jane Doe",
      contactPhone: "555-0100",
    });
    expect(context.previous).toEqual(PROVIDER);
  });

  it("rolls back to the previous provider details on mutation error", () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticHousingProviderUpdate(queryUtils);

    handlers.onError(
      new Error("fail"),
      { housingProviderName: "Renamed Housing" },
      { previous: PROVIDER },
    );

    expect(queryUtils.setData).toHaveBeenCalledWith(PROVIDER);
  });

  it("does not roll back when there is no context", () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticHousingProviderUpdate(queryUtils);

    handlers.onError(
      new Error("fail"),
      { housingProviderName: "Renamed Housing" },
      undefined,
    );

    expect(queryUtils.setData).not.toHaveBeenCalled();
  });
});

describe("createOptimisticProfileUpdate", () => {
  it("optimistically writes only the fields sent", async () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticProfileUpdate(queryUtils);

    const context = await handlers.onMutate({ contactName: "John Doe" });

    expect(queryUtils.cancel).toHaveBeenCalled();
    expect(queryUtils.getLatest()).toMatchObject({
      housingProviderName: "Acme Housing",
      contactName: "John Doe",
      contactPhone: "555-0100",
    });
    expect(context.previous).toEqual(PROVIDER);
  });

  it("stores an empty phone as null", async () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticProfileUpdate(queryUtils);

    await handlers.onMutate({ contactPhone: "" });

    expect(queryUtils.getLatest()?.contactPhone).toBeNull();
  });

  it("never leaves the required name blank", async () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticProfileUpdate(queryUtils);

    await handlers.onMutate({ contactPhone: "208-555-0199" });

    expect(queryUtils.getLatest()?.contactName).toBe("Jane Doe");
  });

  it("rolls back to the previous provider details on mutation error", () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticProfileUpdate(queryUtils);

    handlers.onError(
      new Error("fail"),
      { contactName: "John Doe" },
      {
        previous: PROVIDER,
      },
    );

    expect(queryUtils.setData).toHaveBeenCalledWith(PROVIDER);
  });

  it("does not roll back when there is no context", () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticProfileUpdate(queryUtils);

    handlers.onError(new Error("fail"), { contactName: "John Doe" }, undefined);

    expect(queryUtils.setData).not.toHaveBeenCalled();
  });
});

describe("createOptimisticLocationUpdate", () => {
  const UPDATE = {
    locationId: "loc-1",
    streetAddress: "456 Oak Ave",
    city: "Meridian",
    state: "ID",
    zip: "83642",
    district: "D3",
    acceptedGender: "FEMALE",
    acceptsRiders: true,
    acceptsSexOffenders: true,
    acceptsViolentCriminals: false,
    faithBased: true,
  } as const;

  it("optimistically replaces the matching location's editable fields", async () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticLocationUpdate(queryUtils);

    await handlers.onMutate(UPDATE);

    expect(queryUtils.getLatest()?.locations).toEqual([
      {
        id: "loc-1",
        streetAddress: "456 Oak Ave",
        city: "Meridian",
        state: "ID",
        zip: "83642",
        district: "D3",
        acceptedGenders: ["FEMALE"],
        acceptsRiders: true,
        acceptsSexOffenders: true,
        acceptsViolentCriminals: false,
        faithBased: true,
      },
    ]);
  });

  it("optimistically writes only the field sent, leaving the rest as-is", async () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticLocationUpdate(queryUtils);

    await handlers.onMutate({ locationId: "loc-1", city: "Nampa" });

    expect(queryUtils.getLatest()?.locations).toEqual([
      { ...PROVIDER.locations[0], city: "Nampa" },
    ]);
  });

  it("leaves other locations untouched", async () => {
    const otherLocation = { ...PROVIDER.locations[0], id: "loc-2" };
    const queryUtils = createQueryUtils({
      ...PROVIDER,
      locations: [PROVIDER.locations[0], otherLocation],
    });
    const handlers = createOptimisticLocationUpdate(queryUtils);

    await handlers.onMutate(UPDATE);

    expect(queryUtils.getLatest()?.locations[1]).toEqual(otherLocation);
  });

  it("rolls back to the previous provider details on mutation error", () => {
    const queryUtils = createQueryUtils(PROVIDER);
    const handlers = createOptimisticLocationUpdate(queryUtils);

    handlers.onError(new Error("fail"), UPDATE, { previous: PROVIDER });

    expect(queryUtils.setData).toHaveBeenCalledWith(PROVIDER);
  });
});
