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
import tk from "timekeeper";

import { residentsConfigByState } from "~@jii/configs";

import { createTrpcClientForApi } from "../apis/data/trpcMixin";
import { ResidentsStore } from "./ResidentsStore";
import { RootStore } from "./RootStore";

vi.mock("../apis/data/trpcMixin");

let store: ResidentsStore;

const queryUserPropertiesMock = vi.fn();
const mutateUserPropertiesMock = vi.fn();
const queryGetFlagsMock = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();

  vi.mocked(createTrpcClientForApi).mockReturnValue(
    // @ts-expect-error minimal stub
    {
      user: {
        getProperties: { query: queryUserPropertiesMock },
        setProperties: { mutate: mutateUserPropertiesMock },
        getFlags: { query: queryGetFlagsMock },
      },
    },
  );

  store = new ResidentsStore(
    new RootStore(),
    "US_AZ",
    residentsConfigByState.US_AZ,
  );
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

  test("track onboarding", async () => {
    tk.withFreeze(testTimestamp, async () => {
      mutateUserPropertiesMock.mockResolvedValue({
        id: "abc123",
        hasSeenOnboarding: testTimestamp,
      });
      const updatePromise = store.setUserOnboardingSeen();
      // optimistic update
      expect(store.userProperties).toMatchInlineSnapshot(`
        {
          "hasSeenOnboarding": 2025-12-09T12:30:00.000Z,
        }
      `);

      await updatePromise;

      expect(mutateUserPropertiesMock).toHaveBeenCalledWith({
        hasSeenOnboarding: testTimestamp,
      });
      // value should still be the same
      expect(store.userProperties).toMatchInlineSnapshot(`
        {
          "hasSeenOnboarding": 2025-12-09T12:30:00.000Z,
        }
      `);
    });
    expect.hasAssertions();
  });

  test("hide sentence dates", async () => {
    mutateUserPropertiesMock.mockResolvedValue({
      id: "abc123",
      hideSentenceDates: true,
    });
    const updatePromise = store.setHideSentenceDates(true);
    // optimistic update
    expect(store.userProperties).toEqual({ hideSentenceDates: true });

    await updatePromise;

    expect(mutateUserPropertiesMock).toHaveBeenCalledWith({
      hideSentenceDates: true,
    });
    expect(store.userProperties).toEqual({ hideSentenceDates: true });
  });
});
