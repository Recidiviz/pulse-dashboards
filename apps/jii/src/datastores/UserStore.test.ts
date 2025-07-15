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

import { configure } from "mobx";

import { isDemoMode, isOfflineMode, isTestEnv } from "~client-env-utils";

import { SegmentClient } from "../apis/Segment/SegmentClient";
import { USER_PROPERTY_KEYS, UserStore } from "./UserStore";

vi.mock("~client-env-utils");

let store: UserStore;

beforeEach(() => {
  configure({ safeDescriptors: false });

  vi.mocked(isOfflineMode).mockReturnValue(false);
  // make sure we are verifying the non-test behavior
  vi.mocked(isTestEnv).mockReturnValue(false);

  store = new UserStore();

  vi.spyOn(store.authManager, "authState", "get").mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "US_ME",
      externalId: "123456",
      pseudonymizedId: "test-pid",
    },
  });
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("state authorization for external user", () => {
  expect(store.isAuthorizedForStateUrl("maine")).toBeTrue();

  vi.spyOn(store.authManager, "authState", "get").mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "US_XX",
      externalId: "123456",
      pseudonymizedId: "test-pid",
    },
  });

  expect(store.isAuthorizedForStateUrl("maine")).toBeFalse();
});

test("state authorization for external demo user", () => {
  vi.mocked(isDemoMode).mockReturnValue(true);

  expect(store.isAuthorizedForStateUrl("maine")).toBeTrue();

  vi.spyOn(store.authManager, "authState", "get").mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "US_XX",
      externalId: "123456",
      pseudonymizedId: "test-pid",
    },
  });

  expect(store.isAuthorizedForStateUrl("maine")).toBeFalse();
});

test("state authorization for internal user", () => {
  vi.spyOn(store.authManager, "authState", "get").mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "RECIDIVIZ",
      allowedStates: ["US_ME"],
    },
  });

  expect(store.isAuthorizedForStateUrl("maine")).toBeTrue();

  vi.spyOn(store.authManager, "authState", "get").mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "RECIDIVIZ",
      allowedStates: ["US_XX"],
    },
  });
  expect(store.isAuthorizedForStateUrl("maine")).toBeFalse();
});

test("authorize all states for internal demo user", () => {
  vi.mocked(isDemoMode).mockReturnValue(true);

  vi.spyOn(store.authManager, "authState", "get").mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "RECIDIVIZ",
      allowedStates: ["US_ME"],
    },
  });
  expect(store.isAuthorizedForStateUrl("maine")).toBeTrue();

  vi.spyOn(store.authManager, "authState", "get").mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "RECIDIVIZ",
      allowedStates: ["US_XX"],
    },
  });
  expect(store.isAuthorizedForStateUrl("maine")).toBeTrue();
});

test("authorize multiple states for user", () => {
  vi.spyOn(store.authManager, "authState", "get").mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "PARTNER",
      allowedStates: ["US_ME", "US_MA"],
    },
  });

  expect(store.isAuthorizedForStateUrl("maine")).toBeTrue();
  expect(store.isAuthorizedForStateUrl("mass")).toBeTrue();
  expect(store.isAuthorizedForStateUrl("idaho")).toBeFalse();
});

test("has permission", () => {
  expect(store.hasPermission("enhanced")).toBeFalse();

  // note that this is irrespective of state code
  vi.spyOn(store.authManager, "authState", "get").mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "US_ME",
      permissions: ["enhanced"],
    },
  });
  expect(store.hasPermission("enhanced")).toBeTrue();
});

test("reads externalId from app metadata", () => {
  expect(store.externalId).toBe("123456");
});

test("reads pseudonymizedId from app metadata", () => {
  expect(store.pseudonymizedId).toBe("test-pid");
});

test("log out", () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  vi.spyOn(store.authManager.authClient!, "logOut");

  store.logOut();
  expect(store.authManager.authClient?.logOut).toHaveBeenCalled();
});

test("identify to trackers", () => {
  vi.spyOn(SegmentClient.prototype, "identify");

  store.identifyToTrackers();

  expect(SegmentClient.prototype.identify).toHaveBeenCalledExactlyOnceWith(
    "test-pid",
  );
});

test("do not identify to trackers when user has no pseudo ID", () => {
  vi.spyOn(SegmentClient.prototype, "identify");

  vi.spyOn(store.authManager, "authState", "get").mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "RECIDIVIZ",
      allowedStates: ["US_ME"],
    },
  });

  store.identifyToTrackers();

  expect(SegmentClient.prototype.identify).not.toHaveBeenCalled();
});

test("allowed states", () => {
  const authStateSpy = vi
    .spyOn(store.authManager, "authState", "get")
    .mockReturnValue({
      status: "authorized",
      userProfile: {
        stateCode: "US_ME",
        externalId: "123456",
        pseudonymizedId: "test-pid",
      },
    });

  expect(store.allowedStates).toEqual(["US_ME"]);

  authStateSpy.mockReturnValue({
    status: "authorized",
    userProfile: {
      stateCode: "PARTNER",
      allowedStates: ["US_ME", "US_MA", "US_ID"],
    },
  });
  expect(store.allowedStates).toEqual(
    expect.arrayContaining(["US_ME", "US_MA", "US_ID"]),
  );
});

test.each(USER_PROPERTY_KEYS.options)("user properties: %s", (key) => {
  const value = "foo";

  expect(store.getUserProperty(key)).toBeNull();
  store.setUserProperty(key, value);
  expect(store.getUserProperty(key)).toBe(value);
});
