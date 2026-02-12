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

  test("UPCOMING status", async () => {
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
    expect(await caller.rnaStatusList(testInput)).toMatchInlineSnapshot(`
      [
        {
          "pseudonymizedId": "abc",
          "status": "UPCOMING",
        },
        {
          "pseudonymizedId": "def",
          "status": "UPCOMING",
        },
        {
          "pseudonymizedId": "ghi",
          "status": "UPCOMING",
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
    expect(await caller.rnaStatusList(testInput)).toMatchInlineSnapshot(`
      [
        {
          "completedAt": undefined,
          "createdAt": 2026-01-05T00:00:00.000Z,
          "pseudonymizedId": "abc",
          "status": "NOT_STARTED",
          "submittedByStaffAt": undefined,
          "updatedAt": 2026-01-10T00:00:00.000Z,
        },
      ]
    `);
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
    expect(await caller.rnaStatusList(testInput)).toMatchInlineSnapshot(`
      [
        {
          "completedAt": undefined,
          "createdAt": 2026-01-05T00:00:00.000Z,
          "pseudonymizedId": "abc",
          "status": "IN_PROGRESS",
          "submittedByStaffAt": undefined,
          "updatedAt": 2026-01-10T00:00:00.000Z,
        },
      ]
    `);
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
    expect(await caller.rnaStatusList(testInput)).toMatchInlineSnapshot(`
      [
        {
          "completedAt": 2026-01-05T00:00:00.000Z,
          "createdAt": 2026-01-05T00:00:00.000Z,
          "pseudonymizedId": "abc",
          "status": "COMPLETE",
          "submittedByStaffAt": undefined,
          "updatedAt": 2026-01-10T00:00:00.000Z,
        },
      ]
    `);
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
    expect(await caller.rnaStatusList(testInput)).toMatchInlineSnapshot(`
      [
        {
          "completedAt": 2026-01-05T00:00:00.000Z,
          "createdAt": 2026-01-05T00:00:00.000Z,
          "pseudonymizedId": "abc",
          "status": "SUBMITTED_BY_STAFF",
          "submittedByStaffAt": 2026-01-10T00:00:00.000Z,
          "updatedAt": 2026-01-10T00:00:00.000Z,
        },
      ]
    `);
  });
});
