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

import { subDays } from "date-fns/esm";
import { freeze, reset } from "timekeeper";

import { Prisma } from "~@jii/prisma";

import { userId } from "../../../../../test/context";
import { testPrismaClient } from "../../../../../test/prisma";
import {
  caller,
  mockCollectionQuerier,
} from "../../../../../test/US_NC/mockStaffProcedure";

const testDate = new Date(2026, 0, 10);
const recentDate = subDays(testDate, 55);
const olderDate = subDays(testDate, 75);

const testResidents = [
  {
    pseudonymizedId: "abc",
  },
  {
    pseudonymizedId: "def",
  },
  {
    pseudonymizedId: "ghi",
  },
  {
    pseudonymizedId: "jkl",
  },
];
const additionalResidents = [
  {
    pseudonymizedId: "some-other-id",
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

describe("rnaWritebackStatusList", () => {
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
    await testPrismaClient.usNcRNAWritebackData.deleteMany({});
    reset();
  });

  test("firestore lookup for residents", async () => {
    await caller.rnaWritebackStatusList(testInput);
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
          createdAt: recentDate,
          answers: {},
        },
      ],
    });

    expect(await caller.rnaWritebackStatusList(testInput)).toEqual(
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
          updatedAt: recentDate,
          answers: {},
        },
        // this one is not the most recent for the resident and should be omitted from the results
        {
          pseudonymizedId: testResidents[1].pseudonymizedId,
          updatedAt: olderDate,
          answers: {},
        },
        {
          pseudonymizedId: testResidents[1].pseudonymizedId,
          updatedAt: recentDate,
          answers: {},
        },
        // this one is older but still the most recent
        {
          pseudonymizedId: testResidents[2].pseudonymizedId,
          updatedAt: olderDate,
          answers: {},
        },
        // this should be filtered out because the resident is not part of the query
        {
          pseudonymizedId: additionalResidents[0].pseudonymizedId,
          createdAt: recentDate,
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

    expect(await caller.rnaWritebackStatusList(testInput)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pseudonymizedId: testResidents[0].pseudonymizedId,
          updatedAt: recentDate,
        }),
        expect.objectContaining({
          pseudonymizedId: testResidents[1].pseudonymizedId,
          updatedAt: recentDate,
        }),
        expect.objectContaining({
          pseudonymizedId: testResidents[2].pseudonymizedId,
          updatedAt: olderDate,
        }),
      ]),
    );
  });

  describe("status", () => {
    beforeEach(() => {
      mockFirestoreGet.get.mockResolvedValue({
        docs: testResidents.slice(0, 1).map((r) => ({
          data() {
            return r;
          },
        })),
      });
    });

    describe("NOT_STARTED", () => {
      test("non-null seq number + no existing RNA", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "NOT_STARTED",
        );
      });

      test("non-null seq number + complete RNA with mismatched seq number", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              createdAt: olderDate,
              updatedAt: olderDate,
              completedAt: olderDate,
              seqNumber: "999",
              admitDate: recentDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "NOT_STARTED",
        );
      });

      test("non-null seq number + complete RNA with mismatched admit date", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              createdAt: olderDate,
              updatedAt: olderDate,
              completedAt: olderDate,
              seqNumber: "002",
              admitDate: olderDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "NOT_STARTED",
        );
      });

      test("non-null seq number + existing RNA without seq number or admit date (pre-writeback)", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              createdAt: olderDate,
              updatedAt: olderDate,
              completedAt: olderDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "NOT_STARTED",
        );
      });

      test("non-null seq number + submitted pre-writeback RNA", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              createdAt: olderDate,
              updatedAt: olderDate,
              completedAt: olderDate,
              submittedByStaffAt: olderDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "NOT_STARTED",
        );
      });

      test("non-null seq number + in-progress latest RNA with mismatched seq number older than 60 days", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              seqNumber: "999",
              admitDate: recentDate,
              updatedAt: olderDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "NOT_STARTED",
        );
      });

      test("non-null seq number + in-progress latest RNA with mismatched admit date older than 60 days", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              seqNumber: "002",
              admitDate: olderDate,
              updatedAt: olderDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "NOT_STARTED",
        );
      });
    });

    describe("IN_PROGRESS", () => {
      test("non-null seq number + in-progress RNA with matching seq number/admit date", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              seqNumber: "002",
              admitDate: recentDate,
              updatedAt: olderDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "IN_PROGRESS",
        );
      });

      test("non-null seq number + in-progress RNA with mismatched seq number in the last 60 days", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              seqNumber: "999",
              admitDate: recentDate,
              updatedAt: recentDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "IN_PROGRESS",
        );
      });

      test("non-null seq number + in-progress RNA with mismatched admit date in the last 60 days", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              seqNumber: "002",
              admitDate: testDate,
              updatedAt: recentDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "IN_PROGRESS",
        );
      });
    });

    describe("COMPLETE", () => {
      test("null seq number + completed RNA", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: null,
              admitDate: null,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              seqNumber: "002",
              admitDate: olderDate,
              updatedAt: recentDate,
              completedAt: recentDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "COMPLETE",
        );
      });

      test("non-null seq number + completed RNA with matching seq number/admit date", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: "002",
              admitDate: recentDate,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              seqNumber: "002",
              admitDate: recentDate,
              updatedAt: recentDate,
              completedAt: recentDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "COMPLETE",
        );
      });
    });

    describe("UPCOMING", () => {
      test("null seq number + in-progress latest RNA with seq number and admit date", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: null,
              admitDate: null,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              seqNumber: "002",
              admitDate: recentDate,
              updatedAt: recentDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "UPCOMING",
        );
      });

      test("null seq number + in-progress RNA without seq number or admit date (pre-writeback)", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: null,
              admitDate: null,
              importedAt: testDate,
            },
          ],
        });

        await testPrismaClient.usNcRNA.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              answers: {},
              updatedAt: recentDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "UPCOMING",
        );
      });

      test("null seq number + no existing RNA", async () => {
        await testPrismaClient.usNcRNAWritebackData.createMany({
          data: [
            {
              pseudonymizedId: testResidents[0].pseudonymizedId,
              opusId: testResidents[0].pseudonymizedId,
              seqNumber: null,
              admitDate: null,
              importedAt: testDate,
            },
          ],
        });

        expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
          "UPCOMING",
        );
      });
    });

    test("SUBMITTED_BY_STAFF (legacy status)", async () => {
      await testPrismaClient.usNcRNA.createMany({
        data: [
          {
            pseudonymizedId: testResidents[0].pseudonymizedId,
            createdAt: recentDate,
            completedAt: recentDate,
            answers: {},
            submittedByStaffAt: testDate,
            // deliberately not specifying seq number or admit date,
            // to mimic a pre-writeback form submission
          },
        ],
      });
      expect((await caller.rnaWritebackStatusList(testInput))[0].status).toBe(
        "SUBMITTED_BY_STAFF",
      );
    });
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
            }),
          ),
          // different facilityId, so these should be excluded by the Prisma query
          ...additionalResidents.map((r) =>
            buildResidentRecord({
              pseudonymizedId: r.pseudonymizedId,
              facilityId: "some-other-facility",
            }),
          ),
        ],
      });

      const result = await caller.rnaWritebackStatusList(testInput);

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
        }),
      });

      const result = await caller.rnaWritebackStatusList({
        lookupField: "officerId",
        lookupValue: ["officer1"],
      });

      expect(result).toEqual([
        expect.objectContaining({
          pseudonymizedId: testResidents[0].pseudonymizedId,
        }),
      ]);
    });
  });
});
