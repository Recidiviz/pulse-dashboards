// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { UserAppMetadata } from "../../RootStore/types";
import { isOfflineMode } from "../../utils/isOfflineMode";
import { authenticate } from "../firestore";

jest.mock("firebase/auth");
jest.mock("../../utils/isOfflineMode");

describe("test authenticate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  jest
    .spyOn(global, "fetch")
    .mockImplementation(
      jest.fn(() =>
        Promise.resolve({ json: () => Promise.resolve("token123") })
      ) as jest.Mock
    );

  test("Should call /token", async () => {
    const auth0Token = "token123";
    const appMetadata: UserAppMetadata = {
      state_code: "us_nd",
      can_access_leadership_dashboard: false,
      can_access_case_triage: false,
      should_see_beta_charts: false,
      routes: {
        workflows: true,
      },
    };
    await authenticate(auth0Token, appMetadata);
    expect(fetch).toBeCalled();
  });

  test("Should not call /token", async () => {
    const auth0Token = "token123";
    const appMetadata: UserAppMetadata = {
      state_code: "us_nd",
      can_access_leadership_dashboard: false,
      can_access_case_triage: false,
      should_see_beta_charts: false,
      routes: {
        workflows: false,
      },
    };
    await authenticate(auth0Token, appMetadata);
    expect(fetch).not.toBeCalled();
  });

  test("Should call /token for recidiviz user", async () => {
    const auth0Token = "token123";
    const appMetadata: UserAppMetadata = {
      state_code: "recidiviz",
      can_access_leadership_dashboard: false,
      can_access_case_triage: false,
      should_see_beta_charts: false,
    };
    await authenticate(auth0Token, appMetadata);
    expect(fetch).toBeCalled();
  });

  test("Should call /token for offline user", async () => {
    const isOfflineModeMock = isOfflineMode as jest.Mock;
    isOfflineModeMock.mockReturnValue(true);
    const auth0Token = "token123";
    await authenticate(auth0Token);
    expect(fetch).toBeCalled();
  });
});
