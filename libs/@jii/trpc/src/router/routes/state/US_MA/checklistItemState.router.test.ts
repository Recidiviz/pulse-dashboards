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

import { reentryChecklistConfig, reentryChecklistItemIds } from "~@jii/configs";

import {
  caller,
  mockCtx,
  testPseudonymizedId,
} from "../../../../test/mockStateProcedure";
import { testPrismaClient } from "../../../../test/prisma";

// Items with no showIf apply to every resident
const genericItemIds = reentryChecklistItemIds
  .filter((itemId) => !reentryChecklistConfig[itemId].showIf)
  .sort();

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  vi.setSystemTime("2022-02-02");
  mockCtx.stateCode = "US_MA";
});

async function getItemIds(pseudonymizedId: string) {
  const rows = await testPrismaClient.usMaReentryChecklistItemState.findMany({
    where: { pseudonymizedId },
  });
  return rows.map((r) => r.itemId).sort();
}

describe("getReentryChecklistItemStates", () => {
  it("returns only the generic items when no questionnaire exists", async () => {
    const result = await caller.usMa.getReentryChecklistItemStates({
      pseudonymizedId: testPseudonymizedId,
    });

    expect(result.map((r) => r.itemId).sort()).toEqual(genericItemIds);
  });

  it("returns only the generic items when the questionnaire is unsubmitted", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: "in-progress-questionnaire",
        pseudonymizedId: testPseudonymizedId,
        answers: { HOUSING: "FAMILY" },
        completedAt: null,
      },
    });

    const result = await caller.usMa.getReentryChecklistItemStates({
      pseudonymizedId: testPseudonymizedId,
    });

    expect(result.map((r) => r.itemId).sort()).toEqual(genericItemIds);
  });

  it("includes items applicable to a submitted questionnaire's answers", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: "submitted-questionnaire",
        pseudonymizedId: testPseudonymizedId,
        answers: { HOUSING: "FAMILY" },
        completedAt: new Date("2022-01-01"),
      },
    });

    const result = await caller.usMa.getReentryChecklistItemStates({
      pseudonymizedId: testPseudonymizedId,
    });

    expect(result.map((r) => r.itemId).sort()).toEqual(
      [
        ...genericItemIds,
        "HOUSING_PLAN_AGREEMENT",
        "HAS_RENT_PAYMENT_PLAN",
      ].sort(),
    );
  });

  it("does not reset an already-checked item's state on a repeat call", async () => {
    await caller.usMa.getReentryChecklistItemStates({
      pseudonymizedId: testPseudonymizedId,
    });
    await caller.usMa.updateReentryChecklistItemState({
      pseudonymizedId: testPseudonymizedId,
      itemId: "BACKUP_HOUSING",
      checked: true,
    });

    const result = await caller.usMa.getReentryChecklistItemStates({
      pseudonymizedId: testPseudonymizedId,
    });

    expect(result.find((r) => r.itemId === "BACKUP_HOUSING")).toMatchObject({
      checked: true,
    });
  });

  it("excludes a stored row for an item that's no longer applicable", async () => {
    await testPrismaClient.usMaReentryQuestionnaire.create({
      data: {
        id: "submitted-questionnaire",
        pseudonymizedId: testPseudonymizedId,
        answers: { HOUSING: "FAMILY" },
        completedAt: new Date("2022-01-01"),
      },
    });
    // creates HOUSING_PLAN_AGREEMENT's row while it's applicable, and checks it
    await caller.usMa.getReentryChecklistItemStates({
      pseudonymizedId: testPseudonymizedId,
    });
    await caller.usMa.updateReentryChecklistItemState({
      pseudonymizedId: testPseudonymizedId,
      itemId: "HOUSING_PLAN_AGREEMENT",
      checked: true,
    });

    // change the answer so HOUSING_PLAN_AGREEMENT is no longer applicable
    await testPrismaClient.usMaReentryQuestionnaire.update({
      where: { id: "submitted-questionnaire" },
      data: { answers: { HOUSING: "OWN_PLACE" } },
    });

    const result = await caller.usMa.getReentryChecklistItemStates({
      pseudonymizedId: testPseudonymizedId,
    });

    expect(result.map((r) => r.itemId)).not.toContain("HOUSING_PLAN_AGREEMENT");
    // the row itself is left alone in the db, not deleted
    await expect(getItemIds(testPseudonymizedId)).resolves.toContain(
      "HOUSING_PLAN_AGREEMENT",
    );
  });

  it("rejects a mismatched pseudonymizedId via residentRestrictedMiddleware", async () => {
    await expect(
      caller.usMa.getReentryChecklistItemStates({
        pseudonymizedId: "another-different-pseudo-id",
      }),
    ).rejects.toThrow();

    // rejected before any rows are created for the other resident
    await expect(getItemIds("another-different-pseudo-id")).resolves.toEqual(
      [],
    );
  });
});

describe("updateReentryChecklistItemState", () => {
  it("throws NOT_FOUND if the row doesn't exist", async () => {
    await expect(
      caller.usMa.updateReentryChecklistItemState({
        pseudonymizedId: testPseudonymizedId,
        itemId: "BACKUP_HOUSING",
        checked: true,
      }),
    ).rejects.toThrow();

    await expect(
      testPrismaClient.usMaReentryChecklistItemState.findUnique({
        where: {
          pseudonymizedId_itemId: {
            pseudonymizedId: testPseudonymizedId,
            itemId: "BACKUP_HOUSING",
          },
        },
      }),
    ).resolves.toBeNull();
  });

  it("updates checked on an existing row", async () => {
    await testPrismaClient.usMaReentryChecklistItemState.create({
      data: {
        pseudonymizedId: testPseudonymizedId,
        itemId: "BACKUP_HOUSING",
        checked: false,
      },
    });

    await caller.usMa.updateReentryChecklistItemState({
      pseudonymizedId: testPseudonymizedId,
      itemId: "BACKUP_HOUSING",
      checked: true,
    });

    await expect(
      testPrismaClient.usMaReentryChecklistItemState.findUnique({
        where: {
          pseudonymizedId_itemId: {
            pseudonymizedId: testPseudonymizedId,
            itemId: "BACKUP_HOUSING",
          },
        },
      }),
    ).resolves.toMatchObject({ checked: true });
  });

  it("rejects a mismatched pseudonymizedId via residentRestrictedMiddleware", async () => {
    await expect(
      caller.usMa.updateReentryChecklistItemState({
        pseudonymizedId: "another-different-pseudo-id",
        itemId: "BACKUP_HOUSING",
        checked: true,
      }),
    ).rejects.toThrow();
  });
});
