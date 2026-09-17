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

import {
  caller,
  mockCtx,
  testPseudonymizedId,
} from "../../../../test/mockStateProcedure";
import { testPrismaClient } from "../../../../test/prisma";
import { textAnswers } from "../../../../test/US_NC/fixtures/rna";

const otherResidentId = "another-resident-id";

beforeEach(() => {
  mockCtx.stateCode = "US_NC";
});

/**
 * Creates a blank RNA belonging to the specified resident and returns its ID.
 */
async function createRNA(pseudonymizedId: string) {
  const { id } = await testPrismaClient.usNcRNA.create({
    data: { pseudonymizedId, answers: {} },
  });
  return id;
}

describe("getRNA", () => {
  it("returns the requester's own RNA", async () => {
    await createRNA(testPseudonymizedId);

    await expect(
      caller.usNc.getRNA({ pseudonymizedId: testPseudonymizedId }),
    ).resolves.toMatchObject({ pseudonymizedId: testPseudonymizedId });
  });

  it("does not return another resident's RNA", async () => {
    await createRNA(otherResidentId);

    await expect(
      caller.usNc.getRNA({ pseudonymizedId: otherResidentId }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCError: You do not have permission to access this resident's data]`,
    );
  });

  it("returns another resident's RNA for a user with enhanced permissions", async () => {
    mockCtx.permissions = ["enhanced"];

    await createRNA(otherResidentId);

    await expect(
      caller.usNc.getRNA({ pseudonymizedId: otherResidentId }),
    ).resolves.toMatchObject({ pseudonymizedId: otherResidentId });
  });
});

describe("updateRNA", () => {
  it("updates the requester's own RNA", async () => {
    const id = await createRNA(testPseudonymizedId);

    await caller.usNc.updateRNA({
      pseudonymizedId: testPseudonymizedId,
      id,
      answers: textAnswers,
      completed: false,
    });

    await expect(
      caller.usNc.getRNA({ pseudonymizedId: testPseudonymizedId }),
    ).resolves.toMatchObject({ textAnswers });
  });

  it("does not update an RNA belonging to another resident", async () => {
    // the requester does own the pseudonymized ID they are passing, so the permission
    // check will pass; the RNA they are trying to write to is what doesn't belong to them
    const otherResidentRNA = await createRNA(otherResidentId);

    await expect(
      caller.usNc.updateRNA({
        pseudonymizedId: testPseudonymizedId,
        id: otherResidentRNA,
        answers: textAnswers,
        completed: false,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCError: Trying to update RNA with invalid id]`,
    );

    await expect(
      testPrismaClient.usNcRNA.findFirstOrThrow({
        where: { id: otherResidentRNA },
      }),
    ).resolves.toMatchObject({ answers: {} });
  });

  it("does not update an RNA for another resident's pseudonymized ID", async () => {
    const otherResidentRNA = await createRNA(otherResidentId);

    await expect(
      caller.usNc.updateRNA({
        pseudonymizedId: otherResidentId,
        id: otherResidentRNA,
        answers: textAnswers,
        completed: false,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TRPCError: You do not have permission to update this resident's data]`,
    );

    await expect(
      testPrismaClient.usNcRNA.findFirstOrThrow({
        where: { id: otherResidentRNA },
      }),
    ).resolves.toMatchObject({ answers: {} });
  });

  it("updates another resident's RNA for a user with global write permissions", async () => {
    mockCtx.permissions = ["global_write"];

    const otherResidentRNA = await createRNA(otherResidentId);

    await caller.usNc.updateRNA({
      pseudonymizedId: otherResidentId,
      id: otherResidentRNA,
      answers: textAnswers,
      completed: false,
    });

    await expect(
      testPrismaClient.usNcRNA.findFirstOrThrow({
        where: { id: otherResidentRNA },
      }),
    ).resolves.toMatchObject({ answers: textAnswers });
  });
});
