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

// We need to spy on getPrismaClient to verify real vs demo data lookups are executed correctly,
// since the test environment collapses everything into a single database
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

const verifyIntercomToken = createVerifier({ key: testIntercomSigningKey });

beforeEach(async () => {
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
  beforeEach(() => {
    // freezing slightly in the past to avoid interference from statewide configs
    // on the useNewResidentData flag. this flag will be removed very soon anyway
    // so this is just a temporary workaround
    tk.freeze("2026-08-01");
  });
  afterEach(() => {
    tk.reset();
  });

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

  test("includes Intercom token when flag is active", async () => {
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

describe("checkDemoResidentsRoster", () => {
  beforeEach(() => {
    // freezing slightly in the past to avoid interference from statewide configs
    // on the useNewResidentData flag. this flag will be removed very soon anyway
    // so this is just a temporary workaround
    tk.freeze("2026-08-01");
  });
  afterEach(() => {
    tk.reset();
  });

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
});
