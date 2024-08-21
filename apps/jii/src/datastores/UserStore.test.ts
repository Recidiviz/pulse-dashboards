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

import { isOfflineMode, isTestEnv } from "~client-env-utils";

import { IntercomClient } from "../apis/Intercom/IntercomClient";
import { SegmentClient } from "../apis/Segment/SegmentClient";
import { UserStore } from "./UserStore";

vi.mock("~client-env-utils");

const externalsStub = { stateCode: "US_ME" } as const;

let store: UserStore;

beforeEach(() => {
  configure({ safeDescriptors: false });

  vi.mocked(isOfflineMode).mockReturnValue(false);
  // make sure we are verifying the non-test behavior
  vi.mocked(isTestEnv).mockReturnValue(false);

  store = new UserStore(externalsStub);

  vi.spyOn(store.authClient, "appMetadata", "get").mockReturnValue({
    stateCode: "US_ME",
    externalId: "123456",
    pseudonymizedId: "test-pid",
    intercomUserHash: "test-hash",
  });
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("state authorization for external user", () => {
  expect(store.isAuthorizedForCurrentState).toBeTrue();

  vi.spyOn(store.authClient, "appMetadata", "get").mockReturnValue({
    stateCode: "US_XX",
    externalId: "123456",
    pseudonymizedId: "test-pid",
    intercomUserHash: "test-hash",
  });

  expect(store.isAuthorizedForCurrentState).toBeFalse();
});

test("state authorization for internal user", () => {
  vi.spyOn(store.authClient, "appMetadata", "get").mockReturnValue({
    stateCode: "RECIDIVIZ",
    allowedStates: ["US_ME"],
  });

  expect(store.isAuthorizedForCurrentState).toBeTrue();

  vi.spyOn(store.authClient, "appMetadata", "get").mockReturnValue({
    stateCode: "RECIDIVIZ",
    allowedStates: ["US_XX"],
  });
  expect(store.isAuthorizedForCurrentState).toBeFalse();
});

test("has permission", () => {
  expect(store.hasPermission("enhanced")).toBeFalse();

  // note that this is irrespective of state code
  vi.spyOn(store.authClient, "appMetadata", "get").mockReturnValue({
    stateCode: "US_ME",
    permissions: ["enhanced"],
  });
  expect(store.hasPermission("enhanced")).toBeTrue();
});

test("reads externalId from app metadata", () => {
  expect(store.externalId).toBe("123456");
});

test("reads pseudonymizedId from app metadata", () => {
  expect(store.pseudonymizedId).toBe("test-pid");
});

test("cannot override externalId without permission", () => {
  expect(() =>
    store.overrideExternalId("foo"),
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: You don't have permission to override external ID]`,
  );
});

test("can override externalId in offline mode", () => {
  vi.mocked(isOfflineMode).mockReturnValue(true);

  expect(store.externalId).not.toBe("foo");

  store.overrideExternalId("foo");
  expect(store.externalId).toBe("foo");
});

test("log out", () => {
  vi.spyOn(store.authClient, "logOut");
  vi.spyOn(store.intercomClient, "logOut");

  store.logOut();
  expect(store.authClient.logOut).toHaveBeenCalled();
  expect(store.intercomClient.logOut).toHaveBeenCalled();
});

test("identify to trackers", () => {
  vi.spyOn(IntercomClient.prototype, "updateUser");
  vi.spyOn(SegmentClient.prototype, "identify");

  store.identifyToTrackers();

  expect(IntercomClient.prototype.updateUser).toHaveBeenCalledWith({
    state_code: "US_ME",
    user_id: "test-pid",
    user_hash: "test-hash",
    external_id: "123456",
  });

  expect(SegmentClient.prototype.identify).toHaveBeenCalledExactlyOnceWith(
    "test-pid",
  );
});

test("identify to Intercom only when we have user hash but no ID", () => {
  vi.spyOn(IntercomClient.prototype, "updateUser");
  vi.spyOn(SegmentClient.prototype, "identify");

  vi.spyOn(store.authClient, "appMetadata", "get").mockReturnValue({
    stateCode: "US_ME",
    intercomUserHash: "test-hash",
  });
  vi.spyOn(store.authClient, "userProperties", "get").mockReturnValue({
    sub: "test-userid",
    email: "test@example.com",
  });

  store.identifyToTrackers();

  expect(IntercomClient.prototype.updateUser).toHaveBeenCalledWith({
    state_code: "US_ME",
    user_id: "test-userid",
    user_hash: "test-hash",
    email: "test@example.com",
  });
  expect(SegmentClient.prototype.identify).not.toHaveBeenCalled();
});

test("do not identify to trackers when user has no hash", () => {
  vi.spyOn(IntercomClient.prototype, "updateUser");
  vi.spyOn(SegmentClient.prototype, "identify");

  vi.spyOn(store.authClient, "appMetadata", "get").mockReturnValue({
    stateCode: "RECIDIVIZ",
    allowedStates: ["US_ME"],
  });

  store.identifyToTrackers();

  expect(IntercomClient.prototype.updateUser).not.toHaveBeenCalled();
  expect(SegmentClient.prototype.identify).not.toHaveBeenCalled();
});
