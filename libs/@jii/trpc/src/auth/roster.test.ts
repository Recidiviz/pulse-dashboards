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

import { createVerifier } from "fast-jwt";
import { getFirestore } from "firebase-admin/firestore";
import tk from "timekeeper";

import { StateCode } from "~@jii/configs";
import { getPrismaClient, Prisma, UserFlagId } from "~@jii/prisma";

import { userId } from "../test/context";
import { testPrismaClient } from "../test/prisma";
import { checkDemoResidentsRoster, checkResidentsRoster } from "./roster";

// random string, not a secret that's used for anything
const testIntercomSigningKey =
  "8bf3263bc6527e57dd73414757249c049297387998fa29cf7e8685115aa2bdbf";
// a state that looks up residents by displayId
const displayIdState: StateCode = "US_CO";
// a state that looks up residents by personExternalId
const externalIdState: StateCode = "US_TN";
// a stand-in for the resident's external ID (e.g. DOC ID), which is distinct
// from userId -- the ID assigned by their auth provider
const residentExternalId = "ext-abc123";

// Firestore access is deprecated and being migrated away from, so we only
// verify whether it's queried at all, not its query shape or results.
vi.mock("../helpers/firebaseAdmin", () => ({
  firebaseApp: vi.fn(),
}));
vi.mock("firebase-admin/firestore");

// getPrismaClient is spied on (not stubbed) so its call args can be asserted
// on while it still resolves to the real test DB client. The initial
// implementation must be pass-through immediately (not just in beforeEach)
// since ../test/prisma's testPrismaClient is built from this at import time.
// TODO(OBT-29541): Once Firestore is removed from the app we don't need to do this anymore
vi.mock("~@jii/prisma", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~@jii/prisma")>();
  return { ...actual, getPrismaClient: vi.fn(actual.getPrismaClient) };
});

// used to seed the DB with matching records
function buildResidentRecord(
  overrides: Partial<Prisma.ResidentCreateInput>,
): Prisma.ResidentCreateInput {
  return {
    importedAt: new Date("2026-01-01"),
    pseudonymizedId: "anonres1",
    personExternalId: "ext1",
    displayId: "display1",
    givenNames: null,
    middleNames: null,
    surname: null,
    facilityId: null,
    unitId: null,
    stateSpecificData: {},
    ...overrides,
  };
}

// safely in the past, so a UserFlagInstance seeded with it always tests active
const flagEffectiveDate = new Date("2020-03-15");

// some tests depend on user flags; this is a convenience method for setting them
function activateFlag(flagId: UserFlagId) {
  return testPrismaClient.userFlagInstance.create({
    data: { userId, flagId, effectiveAt: flagEffectiveDate },
  });
}

const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  get: vi.fn(),
};

// satisfies both the `.doc().get()` and `.collection()...limit().get()`
// shapes checkResidentsRoster/checkDemoResidentsRoster read from
function mockFirestoreRecord(payload: Record<string, unknown>) {
  const data = () => payload;
  mockFirestore.get.mockResolvedValue({ docs: [{ data }], data });
}

const verifyIntercomToken = createVerifier({ key: testIntercomSigningKey });

beforeEach(async () => {
  // mockReset (configured globally) clears mock implementations before each
  // test, so all the mocks have to be rewired here rather than at module scope

  mockFirestore.collection.mockReturnValue(mockFirestore);
  mockFirestore.doc.mockReturnValue(mockFirestore);
  mockFirestore.where.mockReturnValue(mockFirestore);
  mockFirestore.limit.mockReturnValue(mockFirestore);
  // resolves such that no record is found on any Firestore lookup shape,
  // since these tests only care whether Firestore was queried
  mockFirestore.get.mockResolvedValue({ docs: [], data: () => undefined });

  vi.mocked(getFirestore).mockReturnValue(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFirestore as any,
  );

  // we have to recreate this spy before each test because mocks are automatically cleared between tests;
  // the setup in the mock factory was only for imports in our testkit
  const actual =
    await vi.importActual<typeof import("~@jii/prisma")>("~@jii/prisma");
  vi.mocked(getPrismaClient).mockImplementation(actual.getPrismaClient);

  vi.stubEnv("INTERCOM_WEB_SDK_SECRET_KEY", testIntercomSigningKey);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkResidentsRoster", () => {
  test("looks up the live (non-demo) Prisma client for the given state", async () => {
    await checkResidentsRoster({
      stateCode: externalIdState,
      userExternalId: residentExternalId,
      userIdFromAuthProvider: userId,
    });

    expect(getPrismaClient).toHaveBeenCalledWith({
      stateCode: externalIdState,
      demo: false,
    });
  });

  describe("when the useNewResidentData flag is active", () => {
    beforeEach(async () => {
      await activateFlag("useNewResidentData");
    });

    test("returns an AuthorizedUserProfile built from the resident record", async () => {
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "anonres1",
          personExternalId: residentExternalId,
        }),
      });

      const result = await checkResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(result).toEqual({
        stateCode: externalIdState,
        externalId: residentExternalId,
        pseudonymizedId: "anonres1",
        permissions: ["live_data"],
      });
    });

    test("returns undefined when no resident record is found", async () => {
      const result = await checkResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(result).toBeUndefined();
    });

    test("matches residents by displayId for states that use display-id lookup", async () => {
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "anonres1",
          displayId: residentExternalId,
          personExternalId: "someone-else",
        }),
      });

      const result = await checkResidentsRoster({
        stateCode: displayIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(result).toEqual({
        stateCode: displayIdState,
        externalId: "someone-else",
        pseudonymizedId: "anonres1",
        permissions: ["live_data"],
      });
    });

    test("matches residents by personExternalId for other states", async () => {
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "anonres1",
          personExternalId: residentExternalId,
          displayId: "someone-else",
        }),
      });

      const result = await checkResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(result).toEqual({
        stateCode: externalIdState,
        externalId: residentExternalId,
        pseudonymizedId: "anonres1",
        permissions: ["live_data"],
      });
    });

    test("does not query Firestore", async () => {
      await checkResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(getFirestore).not.toHaveBeenCalled();
    });

    test("includes Intercom token when flag is active", async () => {
      // useNewResidentData is already active via the parent beforeEach
      await activateFlag("intercom");

      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "anonres1",
          personExternalId: residentExternalId,
        }),
      });

      // freezing so the timestamp in the payload will be consistent
      const result = await tk.withFreeze(new Date("2026-08-13"), async () => {
        return checkResidentsRoster({
          stateCode: externalIdState,
          userExternalId: residentExternalId,
          userIdFromAuthProvider: userId,
        });
      });

      expect(verifyIntercomToken(result?.intercomToken ?? "")).toEqual({
        user_id: "anonres1",
        iat: 1786579200,
      });
    });
  });

  describe("when the useNewResidentData flag is not active", () => {
    // no flag needs to be seeded here; the DB is reset before every test, so
    // the flag is inactive by default

    test("uses the Firestore record rather than a matching Prisma record", async () => {
      // seeded so the assertion below would fail if this record were
      // (incorrectly) used to satisfy the request instead of Firestore's
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "prisma-anon-id",
          personExternalId: residentExternalId,
        }),
      });
      mockFirestoreRecord({
        personExternalId: "firestore-ext-id",
        pseudonymizedId: "firestore-anon-id",
      });

      const result = await checkResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(result).toEqual({
        stateCode: externalIdState,
        externalId: "firestore-ext-id",
        pseudonymizedId: "firestore-anon-id",
        permissions: ["live_data"],
      });
    });

    test("queries Firestore by collection for states that use display-id lookup", async () => {
      await checkResidentsRoster({
        stateCode: displayIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(mockFirestore.collection).toHaveBeenCalled();
    });

    test("queries Firestore by doc for other states", async () => {
      await checkResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(mockFirestore.doc).toHaveBeenCalled();
    });
  });
});

describe("checkDemoResidentsRoster", () => {
  test("looks up the demo Prisma client for the given state", async () => {
    await checkDemoResidentsRoster({
      stateCode: externalIdState,
      userExternalId: residentExternalId,
      userIdFromAuthProvider: userId,
    });

    expect(getPrismaClient).toHaveBeenCalledWith({
      stateCode: externalIdState,
      demo: true,
    });
  });

  describe("when the useNewResidentData flag is active", () => {
    beforeEach(async () => {
      await activateFlag("useNewResidentData");
    });

    test("returns a ResidentUserProfile built from the resident record", async () => {
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "anonres1",
          personExternalId: residentExternalId,
        }),
      });

      const result = await checkDemoResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(result).toEqual({
        stateCode: externalIdState,
        externalId: residentExternalId,
        pseudonymizedId: "anonres1",
        permissions: [],
      });
    });

    test("returns undefined when no resident record is found", async () => {
      const result = await checkDemoResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(result).toBeUndefined();
    });

    test("does not query Firestore", async () => {
      await checkDemoResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(getFirestore).not.toHaveBeenCalled();
    });
  });

  describe("when the useNewResidentData flag is not active", () => {
    // no flag needs to be seeded here; the DB is reset before every test, so
    // the flag is inactive by default

    test("uses the Firestore record rather than a matching Prisma record", async () => {
      // seeded so the assertion below would fail if this record were
      // (incorrectly) used to satisfy the request instead of Firestore's
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "prisma-anon-id",
          personExternalId: residentExternalId,
        }),
      });
      mockFirestoreRecord({
        personExternalId: "firestore-ext-id",
        pseudonymizedId: "firestore-anon-id",
      });

      const result = await checkDemoResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(result).toEqual({
        stateCode: externalIdState,
        externalId: residentExternalId,
        pseudonymizedId: "firestore-anon-id",
        permissions: [],
      });
    });

    test("queries Firestore", async () => {
      await checkDemoResidentsRoster({
        stateCode: externalIdState,
        userExternalId: residentExternalId,
        userIdFromAuthProvider: userId,
      });

      expect(mockFirestore.collection).toHaveBeenCalled();
    });
  });
});
