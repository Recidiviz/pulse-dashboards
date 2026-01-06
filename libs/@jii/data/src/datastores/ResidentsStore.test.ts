// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { formatISO } from "date-fns";
import { flowResult } from "mobx";

import {
  outputFixture,
  usAzResidents,
  usMeResidents,
  usMeSccpFixtures,
} from "~datatypes";
import { FilterParams } from "~firestore-api";

import { OfflineAPIClient } from "../apis/data/OfflineAPIClient";
import { createTrpcClientForApi } from "../apis/data/trpcMixin";
import { residentsConfigByState } from "../configs/residentsConfig";
import { ResidentsStore } from "./ResidentsStore";
import { RootStore } from "./RootStore";

vi.mock("../apis/data/trpcMixin");

let store: ResidentsStore;

const queryUserPropertiesMock = vi.fn();
const mutateUserPropertiesMock = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();

  vi.mocked(createTrpcClientForApi).mockReturnValue(
    // @ts-expect-error minimal stub
    {
      user: {
        getProperties: { query: queryUserPropertiesMock },
        setProperties: { mutate: mutateUserPropertiesMock },
      },
    },
  );

  store = new ResidentsStore(
    new RootStore(),
    "US_AZ",
    residentsConfigByState.US_AZ,
  );
});

describe("populate residents", () => {
  test("succeeds", async () => {
    expect(store.residentsByExternalId.size).toBe(0);

    await flowResult(store.populateResidents());

    usAzResidents.forEach((r) => {
      expect(store.residentsByExternalId.get(r.personExternalId)).toEqual(r);
    });
  });

  test("fails", async () => {
    vi.spyOn(OfflineAPIClient.prototype, "residents").mockRejectedValue(
      new Error("api request failed"),
    );

    await expect(async () =>
      flowResult(store.populateResidents()),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: api request failed]`);
  });

  test("does not refetch if already populated", async () => {
    vi.spyOn(OfflineAPIClient.prototype, "residents");

    await flowResult(store.populateResidents());

    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledTimes(1);

    await flowResult(store.populateResidents());
    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledTimes(1);
  });

  test("with filters", async () => {
    vi.spyOn(OfflineAPIClient.prototype, "residents");

    const filter: FilterParams = ["foo", "==", "bar"];
    await flowResult(store.populateResidents([filter]));

    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledWith("US_AZ", [
      filter,
    ]);
  });

  test("refetches with force refresh", async () => {
    vi.spyOn(OfflineAPIClient.prototype, "residents");

    await flowResult(store.populateResidents());

    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledTimes(1);

    await flowResult(store.populateResidents(undefined, true));
    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledTimes(2);
  });
});

describe("populate single resident", () => {
  test("succeeds", async () => {
    const expectedRes = usAzResidents[1];

    expect(
      store.residentsByExternalId.get(expectedRes.personExternalId),
    ).toBeUndefined();

    await flowResult(store.populateResidentById(expectedRes.personExternalId));

    expect(
      store.residentsByExternalId.get(expectedRes.personExternalId),
    ).toEqual(expectedRes);
  });

  test("fails", async () => {
    await expect(
      flowResult(store.populateResidentById("does-not-exist")),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Missing data for resident does-not-exist in US_AZ]`,
    );
  });

  test("does not refetch if already populated", async () => {
    const expectedRes = usAzResidents[1];

    vi.spyOn(OfflineAPIClient.prototype, "residentById");

    await flowResult(store.populateResidentById(expectedRes.personExternalId));

    expect(OfflineAPIClient.prototype.residentById).toHaveBeenCalledTimes(1);

    await flowResult(store.populateResidentById(expectedRes.personExternalId));
    expect(OfflineAPIClient.prototype.residentById).toHaveBeenCalledTimes(1);
  });
});

// TODO: revive these when we have actual AZ eligibility data. The logic here still holds but
// they'll fail in the meantime because we can't instantiate a store with US_ME
describe.skip("populate resident eligibility", () => {
  test("succeeds", async () => {
    const expectedRes = usMeResidents[1];
    const expectedEligibility = outputFixture(
      usMeSccpFixtures.RES002eligibleToApplyBeforeXPortionServed,
    );

    expect(
      store.residentOpportunityRecordsByExternalId.get(
        expectedRes.personExternalId,
      ),
    ).toBeUndefined();

    await flowResult(
      store.populateOpportunityRecordByResidentId(
        expectedRes.personExternalId,
        "usMeSCCP",
      ),
    );

    expect(
      store.residentOpportunityRecordsByExternalId.get(
        expectedRes.personExternalId,
      ),
    ).toEqual({ usMeSCCP: expectedEligibility });
  });

  test("succeeds for ineligible resident", async () => {
    expect(
      store.residentOpportunityRecordsByExternalId.get("RES999"),
    ).toBeUndefined();

    await flowResult(
      store.populateOpportunityRecordByResidentId("RES999", "usMeSCCP"),
    );

    expect(store.residentOpportunityRecordsByExternalId.get("RES999")).toEqual(
      expect.objectContaining({
        usMeSCCP: outputFixture(usMeSccpFixtures.RES999Ineligible),
      }),
    );
  });

  test("fails", async () => {
    await expect(async () =>
      flowResult(
        store.populateOpportunityRecordByResidentId(
          "does-not-exist",
          "usMeSCCP",
        ),
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Unable to find usMeSCCP record for does-not-exist]`,
    );
  });

  test("does not refetch if already populated", async () => {
    const expectedRes = usMeResidents[1];

    vi.spyOn(OfflineAPIClient.prototype, "residentEligibility");

    await flowResult(
      store.populateOpportunityRecordByResidentId(
        expectedRes.personExternalId,
        "usMeSCCP",
      ),
    );

    expect(
      OfflineAPIClient.prototype.residentEligibility,
    ).toHaveBeenCalledTimes(1);

    await flowResult(
      store.populateOpportunityRecordByResidentId(
        expectedRes.personExternalId,
        "usMeSCCP",
      ),
    );
    expect(
      OfflineAPIClient.prototype.residentEligibility,
    ).toHaveBeenCalledTimes(1);
  });
});

describe("user-generated properties", () => {
  const testTimestamp = new Date(2025, 11, 9, 12, 30, 0);

  afterEach(() => {
    localStorage.clear();
  });

  test("populate", async () => {
    queryUserPropertiesMock.mockResolvedValue({
      hasSeenOnboarding: testTimestamp,
    });

    await store.populateUserProperties();
    expect(queryUserPropertiesMock).toHaveBeenCalledWith();

    expect(store.userProperties).toMatchInlineSnapshot(`
      {
        "hasSeenOnboarding": 2025-12-09T12:30:00.000Z,
      }
    `);
  });

  test("already populated", async () => {
    store.userProperties = { hasSeenOnboarding: testTimestamp };

    await store.populateUserProperties();
    expect(queryUserPropertiesMock).not.toHaveBeenCalled();
    expect(store.userProperties).toMatchInlineSnapshot(`
      {
        "hasSeenOnboarding": 2025-12-09T12:30:00.000Z,
      }
    `);
  });

  test("user has no properties yet", async () => {
    queryUserPropertiesMock.mockResolvedValue(null);

    await store.populateUserProperties();
    expect(queryUserPropertiesMock).toHaveBeenCalledWith();
    expect(store.userProperties).toBeNull();
  });

  test("migrate AZ from local storage", async () => {
    store = new ResidentsStore(
      new RootStore(),
      "US_AZ",
      residentsConfigByState.US_AZ,
    );

    localStorage.setItem("azOnboardingSeen", formatISO(testTimestamp));
    queryUserPropertiesMock.mockResolvedValue(null);
    mutateUserPropertiesMock.mockResolvedValue(null);

    await store.populateUserProperties();

    expect(store.userProperties).toMatchInlineSnapshot(`
      {
        "hasSeenOnboarding": 2025-12-09T12:30:00.000Z,
      }
    `);

    expect(mutateUserPropertiesMock).toHaveBeenCalledWith({
      hasSeenOnboarding: testTimestamp,
    });
  });

  test("migrate MA from local storage", async () => {
    store = new ResidentsStore(
      new RootStore(),
      "US_MA",
      residentsConfigByState.US_MA,
    );
    localStorage.setItem("egtOnboardingSeen", formatISO(testTimestamp));
    queryUserPropertiesMock.mockResolvedValue(null);
    mutateUserPropertiesMock.mockResolvedValue(null);

    await store.populateUserProperties();

    expect(store.userProperties).toMatchInlineSnapshot(`
      {
        "hasSeenOnboarding": 2025-12-09T12:30:00.000Z,
      }
    `);

    expect(mutateUserPropertiesMock).toHaveBeenCalledWith({
      hasSeenOnboarding: testTimestamp,
    });
  });

  test("update", async () => {
    mutateUserPropertiesMock.mockResolvedValue({
      id: "abc123",
      hasSeenOnboarding: testTimestamp,
    });
    await store.setUserProperties({
      hasSeenOnboarding: testTimestamp,
    });

    expect(mutateUserPropertiesMock).toHaveBeenCalledWith({
      hasSeenOnboarding: testTimestamp,
    });

    expect(store.userProperties).toMatchInlineSnapshot(`
      {
        "hasSeenOnboarding": 2025-12-09T12:30:00.000Z,
      }
    `);
  });
});
