// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import firebaseAdmin from "firebase-admin";

import { checkResidentsRoster } from "./firebaseAdmin";
import { secrets } from "./secrets";

vi.mock("firebase-admin");
vi.mock("./secrets");

const mockSecrets: Record<string, string> = {
  DATA_SOURCE_FIREBASE_CREDENTIAL: '{"foo": "bar"}',
  DATA_SOURCE_FIREBASE_CREDENTIAL_PRIVATE_KEY: "test-key",
};

beforeEach(() => {
  vi.mocked(secrets).getLatestValue.mockImplementation(
    async (k) => mockSecrets[k] ?? "",
  );
});

test("don't init Firestore twice", async () => {
  // @ts-expect-error just stubbing what we need for this test
  vi.mocked(firebaseAdmin).firestore.mockResolvedValue({
    doc: vi
      .fn()
      .mockReturnValue({ get: vi.fn().mockResolvedValue({ data: vi.fn() }) }),
  });

  // this method is one of several that awaits what is supposed to be a singleton instance.
  // doesn't much matter which one we call but this is the one that triggered #10208
  const p1 = checkResidentsRoster("US_XX", "test1");
  const p2 = checkResidentsRoster("US_XX", "test2");

  await Promise.all([p1, p2]);

  expect(firebaseAdmin.initializeApp).toHaveBeenCalledOnce();
});

describe("check residents roster", () => {
  test("using person external ID", async () => {
    const firestoreDocMock = vi
      .fn()
      .mockReturnValue({ get: vi.fn().mockResolvedValue({ data: vi.fn() }) });

    // @ts-expect-error just stubbing what we need for this test
    vi.mocked(firebaseAdmin).firestore.mockResolvedValue({
      doc: firestoreDocMock,
    });

    await checkResidentsRoster("US_TN", "abc123");

    expect(firestoreDocMock).toHaveBeenCalledWith("residents/us_tn_abc123");
  });

  test.each(["US_NE", "US_AZ"])(
    "using display ID for %s",
    async (stateCode) => {
      const firestoreMock: Record<string, unknown> = {
        get: () => ({ docs: [{ data: vi.fn() }] }),
      };

      const collectionMock = vi.fn().mockReturnValue(firestoreMock);
      firestoreMock["collection"] = collectionMock;
      const whereMock = vi.fn().mockReturnValue(firestoreMock);
      firestoreMock["where"] = whereMock;
      const limitMock = vi.fn().mockReturnValue(firestoreMock);
      firestoreMock["limit"] = limitMock;

      // @ts-expect-error just stubbing what we need for this test
      vi.mocked(firebaseAdmin).firestore.mockResolvedValue(firestoreMock);

      await checkResidentsRoster(stateCode, "abc123");

      expect(collectionMock).toHaveBeenCalledWith("residents");
      expect(whereMock).toHaveBeenCalledWith("stateCode", "==", stateCode);
      expect(whereMock).toHaveBeenCalledWith("displayId", "==", "abc123");
      expect(limitMock).toHaveBeenCalledWith(1);
    },
  );
});
