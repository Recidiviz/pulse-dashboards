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

import { formatISO } from "date-fns";
import { freeze, reset } from "timekeeper";

import { Prisma } from "~@jii/prisma";

import { userId } from "../../../../../test/context";
import { testPrismaClient } from "../../../../../test/prisma";
import {
  caller,
  mockCollectionQuerier,
} from "../../../../../test/US_NC/mockStaffProcedure";

const testDate = new Date(2026, 0, 10);
const futureDueDate = new Date(2026, 10, 10);
const currentDueDate = new Date(2026, 1, 1);
const pastDueDate = new Date(2025, 11, 1);
const recentRNADate = new Date(2026, 0, 5);
const olderRNADate = new Date(2025, 5, 1);

const testResidents = [
  {
    pseudonymizedId: "abc",
    metadata: {
      stateCode: "US_NC",
      rnaDueDate: formatISO(currentDueDate, { representation: "date" }),
    },
  },
  {
    pseudonymizedId: "def",
    metadata: {
      stateCode: "US_NC",
      rnaDueDate: formatISO(pastDueDate, { representation: "date" }),
    },
  },
  {
    pseudonymizedId: "ghi",
    metadata: {
      stateCode: "US_NC",
      rnaDueDate: formatISO(futureDueDate, { representation: "date" }),
    },
  },
  {
    pseudonymizedId: "jkl",
    metadata: {
      stateCode: "US_NC",
      rnaDueDate: formatISO(testDate, { representation: "date" }),
    },
  },
];
const additionalResidents = [
  {
    pseudonymizedId: "some-other-id",
    metadata: {
      stateCode: "US_NC",
      rnaDueDate: formatISO(currentDueDate, { representation: "date" }),
    },
  },
];

const allResidents = [...testResidents, ...additionalResidents];

const testInput = {
  lookupField: "facilityId" as const,
  lookupValue: ["abc123"],
};

// used to seed the DB for the Prisma-backed resident lookup codepath
function buildResidentRecord(
  overrides: Partial<Prisma.ResidentCreateInput> & {
    pseudonymizedId: string;
  },
): Prisma.ResidentCreateInput {
  return {
    importedAt: testDate,
    personExternalId: overrides.pseudonymizedId,
    displayId: overrides.pseudonymizedId,
    facilityId: null,
    unitId: null,
    officerId: null,
    stateSpecificData: {},
    ...overrides,
  };
}

async function activateNewResidentDataFlag() {
  await testPrismaClient.userFlagInstance.create({
    data: {
      userId,
      flagId: "useNewResidentData",
      effectiveAt: new Date(2020, 0, 1),
    },
  });
}

const mockQuerierObject = { where: vi.fn() };
const mockFirestoreGet = {
  get: vi.fn(),
};

describe("rnaStatusList", () => {
  // stubbing the specific query as a chain of firestore methods :(
  beforeEach(() => {
    freeze(testDate);

    mockFirestoreGet.get.mockResolvedValue({
      docs: [],
    });
    mockQuerierObject.where.mockReturnValue({
      select: vi.fn().mockReturnValue(mockFirestoreGet),
    });
    mockCollectionQuerier.mockReturnValue(mockQuerierObject);
  });

  afterEach(async () => {
    await testPrismaClient.usNcRNA.deleteMany({});
    reset();
  });

  test("firestore lookup for residents", async () => {
    await caller.rnaStatusList(testInput);
    expect(mockQuerierObject.where).toHaveBeenCalledWith("facilityId", "in", [
      "abc123",
    ]);
  });

  test("response includes all residents even if no RNA data", async () => {
    mockFirestoreGet.get.mockResolvedValue({
      docs: allResidents.map((r) => ({
        data() {
          return r;
        },
      })),
    });

    await testPrismaClient.usNcRNA.createMany({
      data: [
        {
          pseudonymizedId: testResidents[0].pseudonymizedId,
          createdAt: recentRNADate,
          answers: {},
        },
      ],
    });

    expect(await caller.rnaStatusList(testInput)).toEqual(
      expect.arrayContaining(
        ...[
          allResidents.map((r) =>
            expect.objectContaining({ pseudonymizedId: r.pseudonymizedId }),
          ),
        ],
      ),
    );
  });

  test("latest records matching input query", async () => {
    // seed DB
    await testPrismaClient.usNcRNA.createMany({
      data: [
        {
          pseudonymizedId: testResidents[0].pseudonymizedId,
          // this wouldn't normally be specified but we are controlling it for the test
          // they are queried by createdAt but the results include updatedAt.
          // values don't matter except to distinguish between records
          createdAt: recentRNADate,
          updatedAt: recentRNADate,
          answers: {},
        },
        // this one is old and should be omitted from the results
        {
          pseudonymizedId: testResidents[1].pseudonymizedId,
          createdAt: olderRNADate,
          updatedAt: olderRNADate,
          answers: {},
        },
        {
          pseudonymizedId: testResidents[1].pseudonymizedId,
          createdAt: recentRNADate,
          updatedAt: recentRNADate,
          answers: {},
        },
        // even though this one is old, it should be included
        // because the resident is not within their next due date window
        {
          pseudonymizedId: testResidents[2].pseudonymizedId,
          createdAt: olderRNADate,
          updatedAt: olderRNADate,
          answers: {},
        },
        // this should be filtered out by the query
        {
          pseudonymizedId: additionalResidents[0].pseudonymizedId,
          createdAt: recentRNADate,
          answers: {},
        },
      ],
    });

    mockFirestoreGet.get.mockResolvedValue({
      docs: testResidents.map((r) => ({
        data() {
          return r;
        },
      })),
    });

    expect(await caller.rnaStatusList(testInput)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pseudonymizedId: testResidents[0].pseudonymizedId,
          updatedAt: recentRNADate,
        }),
        expect.objectContaining({
          pseudonymizedId: testResidents[1].pseudonymizedId,
          updatedAt: recentRNADate,
        }),
        expect.objectContaining({
          pseudonymizedId: testResidents[2].pseudonymizedId,
          updatedAt: olderRNADate,
        }),
      ]),
    );
  });

  test("UPCOMING and DUE status", async () => {
    mockFirestoreGet.get.mockResolvedValue({
      docs: testResidents.map((r) => ({
        data() {
          return r;
        },
      })),
    });
    await testPrismaClient.usNcRNA.createMany({
      data: [
        // this record is too old and should be discarded
        {
          pseudonymizedId: testResidents[0].pseudonymizedId,
          createdAt: olderRNADate,
          // creation date matters, not completion
          completedAt: recentRNADate,
          answers: { foo: ["bar"] },
        },
        // resident 1 is in the window but does not have a record
        // resident 2 is not in the window but also does not have a record
      ],
    });

    // statuses should differ depending on the due date
    expect(await caller.rnaStatusList(testInput)).toMatchInlineSnapshot(`
      [
        {
          "pseudonymizedId": "abc",
          "status": "UPCOMING",
        },
        {
          "pseudonymizedId": "def",
          "status": "DUE",
        },
        {
          "pseudonymizedId": "ghi",
          "status": "UPCOMING",
        },
        {
          "pseudonymizedId": "jkl",
          "status": "DUE",
        },
      ]
    `);
  });

  test("NOT_STARTED status", async () => {
    mockFirestoreGet.get.mockResolvedValue({
      docs: testResidents.slice(0, 1).map((r) => ({
        data() {
          return r;
        },
      })),
    });
    await testPrismaClient.usNcRNA.createMany({
      data: [
        {
          pseudonymizedId: testResidents[0].pseudonymizedId,
          createdAt: recentRNADate,
          answers: {},
        },
      ],
    });
    expect((await caller.rnaStatusList(testInput))[0].status).toBe(
      "NOT_STARTED",
    );
  });

  test("IN_PROGRESS status", async () => {
    mockFirestoreGet.get.mockResolvedValue({
      docs: testResidents.slice(0, 1).map((r) => ({
        data() {
          return r;
        },
      })),
    });
    await testPrismaClient.usNcRNA.createMany({
      data: [
        {
          pseudonymizedId: testResidents[0].pseudonymizedId,
          createdAt: recentRNADate,
          answers: { foo: ["bar"] },
        },
      ],
    });
    expect((await caller.rnaStatusList(testInput))[0].status).toBe(
      "IN_PROGRESS",
    );
  });

  test("COMPLETE status", async () => {
    mockFirestoreGet.get.mockResolvedValue({
      docs: testResidents.slice(0, 1).map((r) => ({
        data() {
          return r;
        },
      })),
    });
    await testPrismaClient.usNcRNA.createMany({
      data: [
        {
          pseudonymizedId: testResidents[0].pseudonymizedId,
          createdAt: recentRNADate,
          completedAt: recentRNADate,
          answers: { foo: ["bar"] },
        },
      ],
    });
    expect((await caller.rnaStatusList(testInput))[0].status).toBe("COMPLETE");
  });

  test("SUBMITTED_BY_STAFF status", async () => {
    mockFirestoreGet.get.mockResolvedValue({
      docs: testResidents.slice(0, 1).map((r) => ({
        data() {
          return r;
        },
      })),
    });
    await testPrismaClient.usNcRNA.createMany({
      data: [
        {
          pseudonymizedId: testResidents[0].pseudonymizedId,
          createdAt: recentRNADate,
          completedAt: recentRNADate,
          answers: { foo: ["bar"] },
          submittedByStaffAt: new Date(),
        },
      ],
    });
    expect((await caller.rnaStatusList(testInput))[0].status).toBe(
      "SUBMITTED_BY_STAFF",
    );
  });

  describe("when the useNewResidentData flag is active", () => {
    beforeEach(async () => {
      await activateNewResidentDataFlag();
    });

    test("looks up residents via Prisma, filtered by lookupField/lookupValue, instead of querying Firestore", async () => {
      await testPrismaClient.resident.createMany({
        data: [
          ...testResidents.map((r) =>
            buildResidentRecord({
              pseudonymizedId: r.pseudonymizedId,
              facilityId: "abc123",
              stateSpecificData: r.metadata,
            }),
          ),
          // different facilityId, so these should be excluded by the Prisma query
          ...additionalResidents.map((r) =>
            buildResidentRecord({
              pseudonymizedId: r.pseudonymizedId,
              facilityId: "some-other-facility",
              stateSpecificData: r.metadata,
            }),
          ),
        ],
      });

      const result = await caller.rnaStatusList(testInput);

      expect(mockCollectionQuerier).not.toHaveBeenCalled();
      expect(result).toHaveLength(testResidents.length);
      expect(result).toEqual(
        expect.arrayContaining(
          testResidents.map((r) =>
            expect.objectContaining({ pseudonymizedId: r.pseudonymizedId }),
          ),
        ),
      );
    });

    test("supports lookup by officerId", async () => {
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: testResidents[0].pseudonymizedId,
          officerId: "officer1",
          stateSpecificData: testResidents[0].metadata,
        }),
      });

      const result = await caller.rnaStatusList({
        lookupField: "officerId",
        lookupValue: ["officer1"],
      });

      expect(result).toEqual([
        expect.objectContaining({
          pseudonymizedId: testResidents[0].pseudonymizedId,
        }),
      ]);
    });

    test("computes UPCOMING and DUE status from due dates sourced via Prisma", async () => {
      await testPrismaClient.resident.createMany({
        data: testResidents.map((r) =>
          buildResidentRecord({
            pseudonymizedId: r.pseudonymizedId,
            facilityId: "abc123",
            stateSpecificData: r.metadata,
          }),
        ),
      });

      expect(await caller.rnaStatusList(testInput)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            pseudonymizedId: "abc",
            status: "UPCOMING",
          }),
          expect.objectContaining({ pseudonymizedId: "def", status: "DUE" }),
          expect.objectContaining({
            pseudonymizedId: "ghi",
            status: "UPCOMING",
          }),
          expect.objectContaining({ pseudonymizedId: "jkl", status: "DUE" }),
        ]),
      );
    });

    test("still uses Prisma-sourced RNA records to compute assessment status", async () => {
      await testPrismaClient.resident.create({
        data: buildResidentRecord({
          pseudonymizedId: testResidents[0].pseudonymizedId,
          facilityId: "abc123",
          stateSpecificData: testResidents[0].metadata,
        }),
      });
      await testPrismaClient.usNcRNA.createMany({
        data: [
          {
            pseudonymizedId: testResidents[0].pseudonymizedId,
            createdAt: recentRNADate,
            completedAt: recentRNADate,
            answers: { foo: ["bar"] },
          },
        ],
      });

      const result = await caller.rnaStatusList(testInput);

      expect(result).toEqual([
        expect.objectContaining({
          pseudonymizedId: testResidents[0].pseudonymizedId,
          status: "COMPLETE",
        }),
      ]);
    });
  });
});
