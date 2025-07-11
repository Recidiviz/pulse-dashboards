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

import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, getAuth, signInWithCustomToken } from "firebase/auth";
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  getDoc,
  getDocs,
  initializeFirestore,
  Query,
  query,
  QueryFieldFilterConstraint,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { pick } from "lodash";
import tk from "timekeeper";
import { Mock } from "vitest";
import { z } from "zod";

import { allResidents, rawAllResidents } from "~datatypes";

import { FirestoreAPIClient } from "../FirestoreAPIClient";

vi.mock("firebase/app");
vi.mock("firebase/auth");
vi.mock("firebase/firestore");

let client: FirestoreAPIClient;

const appMock = "FIREBASE APP MOCK";
const dbMock = "FIRESTORE MOCK";
const authMock = "AUTH MOCK";
const collectionMock = "COLLECTION MOCK";
const whereMock = "WHERE MOCK";
const queryMock = "QUERY MOCK";
const docMock = "DOC MOCK";

const stateCodeMock = "US_XX";

const demoModeStub: Mock<() => boolean> = vi.fn();

beforeEach(() => {
  // these mocks all get passed around to one another for the SDK to use internally;
  // we generally don't care about their return values and can verify behavior by inspecting their arguments.
  // the mock return values are only useful to verify which function was called
  vi.mocked(initializeApp).mockReturnValue(appMock as unknown as FirebaseApp);
  vi.mocked(initializeFirestore).mockReturnValue(
    dbMock as unknown as Firestore,
  );
  vi.mocked(getAuth).mockReturnValue(authMock as unknown as Auth);
  vi.mocked(collection).mockReturnValue(
    collectionMock as unknown as CollectionReference,
  );
  vi.mocked(where).mockReturnValue(
    whereMock as unknown as QueryFieldFilterConstraint,
  );
  vi.mocked(query).mockReturnValue(queryMock as unknown as Query);
  vi.mocked(doc).mockReturnValue(docMock as unknown as DocumentReference);

  client = new FirestoreAPIClient("project-xx", "api-xx", demoModeStub);
});

test("initialize", () => {
  expect(initializeApp).toHaveBeenCalledExactlyOnceWith({
    projectId: "project-xx",
    apiKey: "api-xx",
  });
  expect(initializeFirestore).toHaveBeenCalledExactlyOnceWith(appMock, {});
});

test("initialize with proxy", () => {
  client = new FirestoreAPIClient(
    "project-xx",
    "api-xx",
    demoModeStub,
    "foo.bar",
  );
  expect(initializeFirestore).toHaveBeenLastCalledWith(appMock, {
    host: "foo.bar/firestore",
  });
});

test("authenticate", async () => {
  client.authenticate("token-xx");
  expect(getAuth).toHaveBeenCalledExactlyOnceWith(appMock);
  expect(signInWithCustomToken).toHaveBeenCalledExactlyOnceWith(
    authMock,
    "token-xx",
  );
});

describe("residents", () => {
  const rawFixture = rawAllResidents.slice(0, 2);
  const expectedFixture = allResidents.slice(0, 2);

  const mockSnapshot = {
    docs: rawFixture.map((f) => ({
      data() {
        return f;
      },
      id: f.recordId,
    })),
  } as unknown as QuerySnapshot;

  beforeEach(() => {
    vi.mocked(getDocs).mockResolvedValue(mockSnapshot);
  });

  test("parsed result", async () => {
    const result = await client.residents(stateCodeMock);
    expect(result).toEqual(expectedFixture);
  });

  test("no filters", async () => {
    await client.residents(stateCodeMock);

    expect(collection).toHaveBeenCalledExactlyOnceWith(dbMock, "residents");
    expect(where).toHaveBeenCalledExactlyOnceWith("stateCode", "==", "US_XX");
    expect(query).toHaveBeenCalledExactlyOnceWith(collectionMock, whereMock);
    expect(getDocs).toHaveBeenCalledExactlyOnceWith(queryMock);
  });

  test("with filters", async () => {
    await client.residents(stateCodeMock, [["facilityId", "==", "foo"]]);

    expect(collection).toHaveBeenCalledExactlyOnceWith(dbMock, "residents");
    expect(where).toHaveBeenCalledWith("stateCode", "==", "US_XX");
    expect(where).toHaveBeenCalledWith("facilityId", "==", "foo");
    expect(where).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenCalledExactlyOnceWith(
      collectionMock,
      whereMock,
      whereMock,
    );
    expect(getDocs).toHaveBeenCalledExactlyOnceWith(queryMock);
  });

  test("demo data", async () => {
    tk.freeze(new Date(2025, 6, 8));

    demoModeStub.mockReturnValue(true);

    const result = await client.residents(stateCodeMock);

    expect(collection).toHaveBeenCalledExactlyOnceWith(
      dbMock,
      "DEMO_residents",
    );

    expect(
      // just want to verify that date fields have been changed
      result.map((r) => pick(r, ["admissionDate", "releaseDate"])),
    ).not.toEqual(
      expectedFixture.map((r) => pick(r, ["admissionDate", "releaseDate"])),
    );
    expect(result.map((r) => pick(r, ["admissionDate", "releaseDate"])))
      .toMatchInlineSnapshot(`
      [
        {
          "admissionDate": 2017-06-08T00:00:00.000Z,
          "releaseDate": 2028-06-08T00:00:00.000Z,
        },
        {
          "admissionDate": 2021-09-09T00:00:00.000Z,
          "releaseDate": 2027-09-08T00:00:00.000Z,
        },
      ]
    `);

    tk.reset();
  });
});

describe("resident by pseudo ID", () => {
  const rawFixture = rawAllResidents[0];
  const expectedFixture = allResidents[0];
  const testId = rawFixture.pseudonymizedId;

  const mockSnapshot = {
    docs: [rawFixture].map((f) => ({
      data() {
        return f;
      },
      id: f.recordId,
    })),
    size: 1,
  } as unknown as QuerySnapshot;

  test("parsed result", async () => {
    vi.mocked(getDocs).mockResolvedValue(mockSnapshot);

    const result = await client.residentByPseudoId(stateCodeMock, testId);

    expect(vi.mocked(where).mock.calls).toEqual([
      ["stateCode", "==", "US_XX"],
      ["pseudonymizedId", "==", testId],
    ]);
    expect(result).toEqual(expectedFixture);
  });

  test("no results", async () => {
    const mockSnapshot = {
      size: 0,
    } as unknown as QuerySnapshot;

    vi.mocked(getDocs).mockResolvedValue(mockSnapshot);

    const result = await client.residentByPseudoId(stateCodeMock, testId);
    expect(result).toBeUndefined();
  });

  test("too many results", async () => {
    const mockSnapshot = {
      size: 3,
    } as unknown as QuerySnapshot;

    vi.mocked(getDocs).mockResolvedValue(mockSnapshot);

    await expect(
      client.residentByPseudoId(stateCodeMock, testId),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Found 3 documents matching pseudonymizedId = anonres001 in residents, but only one was expected]`,
    );
  });

  test("demo data", async () => {
    tk.freeze(new Date(2025, 6, 8));
    demoModeStub.mockReturnValue(true);
    vi.mocked(getDocs).mockResolvedValue(mockSnapshot);

    const result = await client.residentByPseudoId(stateCodeMock, testId);

    expect(collection).toHaveBeenCalledExactlyOnceWith(
      dbMock,
      "DEMO_residents",
    );

    expect(
      // just want to verify that date fields have been changed
      pick(result, ["admissionDate", "releaseDate"]),
    ).not.toEqual(pick(expectedFixture, ["admissionDate", "releaseDate"]));
    expect(pick(result, ["admissionDate", "releaseDate"]))
      .toMatchInlineSnapshot(`
      {
        "admissionDate": 2017-06-08T00:00:00.000Z,
        "releaseDate": 2028-06-08T00:00:00.000Z,
      }
    `);

    tk.reset();
  });
});

describe("recordForExternalId", () => {
  test("demo data", async () => {
    demoModeStub.mockReturnValue(true);
    vi.mocked(getDoc).mockResolvedValue({
      // for this test we don't actually care what the data is
      exists: () => false,
    } as unknown as DocumentSnapshot);

    await client.recordForExternalId(
      stateCodeMock,
      { key: "residents" },
      "foo123",
      z.any(),
    );

    expect(doc).toHaveBeenCalledExactlyOnceWith(
      dbMock,
      "DEMO_residents",
      "us_xx_foo123",
    );
  });

  describe("ineligible opportunities filter", () => {
    const mockDataFn = vi.fn();

    beforeEach(() => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: mockDataFn,
      } as unknown as DocumentSnapshot);
    });

    test.for([
      {},
      { isEligible: true },
      { isEligible: false },
      { isAlmostEligible: true },
      { isAlmostEligible: false },
    ])("should pass with missing fields (%o)", async (obj) => {
      mockDataFn.mockReturnValue(obj);
      expect(
        await client.recordForExternalId(
          stateCodeMock,
          { raw: "foo" },
          "abc123",
          z.any(),
        ),
      ).toEqual(obj);
    });

    test.for([
      { isEligible: true, isAlmostEligible: false },
      { isEligible: false, isAlmostEligible: true },
    ])("should pass %o", async (obj) => {
      mockDataFn.mockReturnValue(obj);
      expect(
        await client.recordForExternalId(
          stateCodeMock,
          { raw: "foo" },
          "abc123",
          z.any(),
        ),
      ).toEqual(obj);
    });
  });
});
