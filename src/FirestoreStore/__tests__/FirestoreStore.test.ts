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
/* eslint-disable import/first */
// Delete test env var to test firestore emulator connection
delete process.env.REACT_APP_TEST_ENV;
import { connectAuthEmulator } from "firebase/auth";
import { DocumentReference, setDoc } from "firebase/firestore";

import {
  fetchFirebaseToken,
  fetchImpersonatedFirebaseToken,
} from "../../api/fetchFirebaseToken";
import { RootStore } from "../../RootStore";
import { UserAppMetadata } from "../../RootStore/types";
import { isOfflineMode } from "../../utils/isOfflineMode";
import FirestoreStore from "../FirestoreStore";

jest.mock("firebase/auth");
jest.mock("firebase/firestore");
jest.mock("../../utils/isOfflineMode");

const mockFetchFirebaseToken = fetchFirebaseToken as jest.Mock;
const mockFetchImpersonatedFirebaseToken =
  fetchImpersonatedFirebaseToken as jest.Mock;
const mockConnectAuthEmulator = connectAuthEmulator as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockGetTokenSilently = jest.fn();

jest.mock("../../api/fetchFirebaseToken", () => {
  return {
    fetchFirebaseToken: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve("token123") })
      ),
    fetchImpersonatedFirebaseToken: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ json: () => Promise.resolve("token123") })
      ),
  };
});

describe("FirestoreStore", () => {
  let store: FirestoreStore;
  let mockRootStore = {} as RootStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new FirestoreStore({ rootStore: mockRootStore });
  });

  describe("authenticate", () => {
    test("Should call /token if user can access workflows", async () => {
      const auth0Token = "token123";
      const appMetadata: UserAppMetadata = {
        stateCode: "us_nd",
        routes: {
          workflows: true,
        },
      };
      await store.authenticate(auth0Token, appMetadata);
      expect(mockFetchFirebaseToken).toBeCalled();
    });

    test("Should not call /token if user cannot access workflows", async () => {
      const auth0Token = "token123";
      const appMetadata: UserAppMetadata = {
        stateCode: "us_nd",
        routes: {
          workflows: false,
        },
      };
      await store.authenticate(auth0Token, appMetadata);
      expect(mockFetchFirebaseToken).not.toBeCalled();
    });
    test("Should call /token for recidiviz user", async () => {
      const auth0Token = "token123";
      const appMetadata: UserAppMetadata = {
        stateCode: "recidiviz",
      };
      await store.authenticate(auth0Token, appMetadata);
      expect(mockFetchFirebaseToken).toBeCalled();
    });

    test("Should call /token for offline user", async () => {
      const isOfflineModeMock = isOfflineMode as jest.Mock;
      isOfflineModeMock.mockReturnValue(true);
      const auth0Token = "token123";
      await store.authenticate(auth0Token);
      expect(mockFetchFirebaseToken).toBeCalled();
    });

    test("Should call connectAuthEmulator for offline user", async () => {
      const isOfflineModeMock = isOfflineMode as jest.Mock;
      isOfflineModeMock.mockReturnValue(true);
      const auth0Token = "token123";
      await store.authenticate(auth0Token);
      expect(mockConnectAuthEmulator).toBeCalled();
    });
  });

  describe("authenticateImpersonatedUser", () => {
    const impersonatedEmail = "test@email.com";
    const impersonatedStateCode = "US_TN";

    test("Should fetch impersonated token if recidiviz user", async () => {
      const appMetadata: UserAppMetadata = {
        stateCode: "recidiviz",
        routes: {
          workflows: true,
        },
      };
      await store.authenticateImpersonatedUser(
        impersonatedEmail,
        impersonatedStateCode,
        mockGetTokenSilently,
        appMetadata
      );
      expect(mockFetchImpersonatedFirebaseToken).toBeCalled();
    });

    test("Should not fetch impersonated if user is not recidiviz", async () => {
      const appMetadata: UserAppMetadata = {
        stateCode: "us_nd",
        routes: {
          workflows: false,
        },
      };
      await store.authenticateImpersonatedUser(
        impersonatedEmail,
        impersonatedStateCode,
        mockGetTokenSilently,
        appMetadata
      );
      expect(mockFetchImpersonatedFirebaseToken).not.toBeCalled();
    });
  });

  describe("updateDocument", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, "log");
    });

    test("Does not call setDoc when user is impersonating", () => {
      mockRootStore = {
        isImpersonating: true,
      } as unknown as RootStore;
      store = new FirestoreStore({ rootStore: mockRootStore });
      store.updateDocument(
        "testDocument",
        "recordId",
        {} as DocumentReference,
        {}
      );
      expect(mockSetDoc).not.toBeCalled();
      // eslint-disable-next-line no-console
      expect(console.log).toBeCalledWith(
        "[IMPERSONATOR] Skipping update for: testDocument for id recordId with updates {}"
      );
    });

    test("Calls setDoc when user is not impersonating", () => {
      mockRootStore = {
        isImpersonating: false,
      } as unknown as RootStore;
      store = new FirestoreStore({ rootStore: mockRootStore });
      store.updateDocument(
        "testDocument",
        "recordId",
        {} as DocumentReference,
        {}
      );
      expect(mockSetDoc).toBeCalled();
    });
  });
});
