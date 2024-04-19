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
import { isOfflineMode, isTestEnv } from "~client-env-utils";

import { UserStore } from "./UserStore";

vi.mock("~client-env-utils");

beforeEach(() => {
  vi.mocked(isOfflineMode).mockReturnValue(false);
  // make sure we are verifying the non-test behavior
  vi.mocked(isTestEnv).mockReturnValue(false);
});

test("cannot override externalId without permission", () => {
  const store = new UserStore();

  expect(() =>
    store.overrideExternalId("foo"),
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: You don't have permission to override external ID]`,
  );
});

test("can override externalId in offline mode", () => {
  vi.mocked(isOfflineMode).mockReturnValue(true);

  const store = new UserStore();

  expect(store.externalId).toBeUndefined();

  store.overrideExternalId("foo");
  expect(store.externalId).toBe("foo");
});
