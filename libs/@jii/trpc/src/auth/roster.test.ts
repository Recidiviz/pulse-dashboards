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

import { getFirestore } from "firebase-admin/firestore";

import { StateCode } from "~@jii/configs";
import { getPrismaClient, Prisma } from "~@jii/prisma";

import { isUserFlagActive } from "../helpers/featureFlags";
import { userId } from "../test/context";
import { testPrismaClient } from "../test/prisma";
import { checkDemoResidentsRoster, checkResidentsRoster } from "./roster";

// a state that looks up residents by displayId
const displayIdState: StateCode = "US_CO";
// a state that looks up residents by personExternalId
const externalIdState: StateCode = "US_TN";

// Firestore access is deprecated and being migrated away from, so we only
// verify whether it's queried at all, not its query shape or results.
vi.mock("../helpers/firebaseAdmin", () => ({
  firebaseApp: vi.fn(),
}));
vi.mock("firebase-admin/firestore");

vi.mock("../helpers/featureFlags", () => ({
  isUserFlagActive: vi.fn(),
}));

// getPrismaClient is spied on (not stubbed) so its call args can be asserted
// on while it still resolves to the real (seeded) test DB client. The initial
// implementation must be pass-through immediately (not just in beforeEach)
// since ../test/prisma's testPrismaClient is built from this at import time.
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

  const actual =
    await vi.importActual<typeof import("~@jii/prisma")>("~@jii/prisma");
  vi.mocked(getPrismaClient).mockImplementation(actual.getPrismaClient);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkResidentsRoster", () => {
  test("looks up the live (non-demo) Prisma client for the given state", async () => {
    await checkResidentsRoster(externalIdState, userId);

    expect(getPrismaClient).toHaveBeenCalledWith({
      stateCode: externalIdState,
      demo: false,
    });
  });

  describe("when the useNewResidentData flag is active", () => {
    beforeEach(() => {
      vi.mocked(isUserFlagActive).mockResolvedValue(true);
    });

    test("returns an AuthorizedUserProfile built from the resident record", async () => {
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "anonres1",
          personExternalId: userId,
        }),
      });

      const result = await checkResidentsRoster(externalIdState, userId);

      expect(result).toEqual({
        stateCode: externalIdState,
        externalId: userId,
        pseudonymizedId: "anonres1",
        permissions: ["live_data"],
      });
    });

    test("returns undefined when no resident record is found", async () => {
      const result = await checkResidentsRoster(externalIdState, userId);

      expect(result).toBeUndefined();
    });

    test("matches residents by displayId for states that use display-id lookup", async () => {
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "anonres1",
          displayId: userId,
          personExternalId: "someone-else",
        }),
      });

      const result = await checkResidentsRoster(displayIdState, userId);

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
          personExternalId: userId,
          displayId: "someone-else",
        }),
      });

      const result = await checkResidentsRoster(externalIdState, userId);

      expect(result).toEqual({
        stateCode: externalIdState,
        externalId: userId,
        pseudonymizedId: "anonres1",
        permissions: ["live_data"],
      });
    });

    test("does not query Firestore", async () => {
      await checkResidentsRoster(externalIdState, userId);

      expect(getFirestore).not.toHaveBeenCalled();
    });
  });

  describe("when the useNewResidentData flag is not active", () => {
    beforeEach(() => {
      vi.mocked(isUserFlagActive).mockResolvedValue(false);
    });

    test("uses the Firestore record rather than a matching Prisma record", async () => {
      // seeded so the assertion below would fail if this record were
      // (incorrectly) used to satisfy the request instead of Firestore's
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "prisma-anon-id",
          personExternalId: userId,
        }),
      });
      mockFirestoreRecord({
        personExternalId: "firestore-ext-id",
        pseudonymizedId: "firestore-anon-id",
      });

      const result = await checkResidentsRoster(externalIdState, userId);

      expect(result).toEqual({
        stateCode: externalIdState,
        externalId: "firestore-ext-id",
        pseudonymizedId: "firestore-anon-id",
        permissions: ["live_data"],
      });
    });

    test("queries Firestore by collection for states that use display-id lookup", async () => {
      await checkResidentsRoster(displayIdState, userId);

      expect(mockFirestore.collection).toHaveBeenCalled();
    });

    test("queries Firestore by doc for other states", async () => {
      await checkResidentsRoster(externalIdState, userId);

      expect(mockFirestore.doc).toHaveBeenCalled();
    });
  });
});

describe("checkDemoResidentsRoster", () => {
  test("looks up the demo Prisma client for the given state", async () => {
    await checkDemoResidentsRoster(externalIdState, userId);

    expect(getPrismaClient).toHaveBeenCalledWith({
      stateCode: externalIdState,
      demo: true,
    });
  });

  describe("when the useNewResidentData flag is active", () => {
    beforeEach(() => {
      vi.mocked(isUserFlagActive).mockResolvedValue(true);
    });

    test("returns a ResidentUserProfile built from the resident record", async () => {
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "anonres1",
          personExternalId: userId,
        }),
      });

      const result = await checkDemoResidentsRoster(externalIdState, userId);

      expect(result).toEqual({
        stateCode: externalIdState,
        externalId: userId,
        pseudonymizedId: "anonres1",
        permissions: [],
      });
    });

    test("returns undefined when no resident record is found", async () => {
      const result = await checkDemoResidentsRoster(externalIdState, userId);

      expect(result).toBeUndefined();
    });

    test("does not query Firestore", async () => {
      await checkDemoResidentsRoster(externalIdState, userId);

      expect(getFirestore).not.toHaveBeenCalled();
    });
  });

  describe("when the useNewResidentData flag is not active", () => {
    beforeEach(() => {
      vi.mocked(isUserFlagActive).mockResolvedValue(false);
    });

    test("uses the Firestore record rather than a matching Prisma record", async () => {
      // seeded so the assertion below would fail if this record were
      // (incorrectly) used to satisfy the request instead of Firestore's
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: "prisma-anon-id",
          personExternalId: userId,
        }),
      });
      mockFirestoreRecord({
        personExternalId: "firestore-ext-id",
        pseudonymizedId: "firestore-anon-id",
      });

      const result = await checkDemoResidentsRoster(externalIdState, userId);

      expect(result).toEqual({
        stateCode: externalIdState,
        externalId: userId,
        pseudonymizedId: "firestore-anon-id",
        permissions: [],
      });
    });

    test("queries Firestore", async () => {
      await checkDemoResidentsRoster(externalIdState, userId);

      expect(mockFirestore.collection).toHaveBeenCalled();
    });
  });
});
