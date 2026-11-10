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

import type { PrismaClient } from "~@idaho-th/prisma/client";

const draftIntakeCleanupMocks = vi.hoisted(() => ({
  sweepStaleIntakeShells: vi.fn(),
  sweepInfectedIntakeShells: vi.fn(),
}));
const documentsServiceMocks = vi.hoisted(() => ({
  sweepStalePendingDocuments: vi.fn(),
  countStuckScanDocuments: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/routes/draftIntake/draftIntake.cleanup", () => ({
  ...draftIntakeCleanupMocks,
}));
vi.mock("~@idaho-th/trpc/routes/documents/documents.service", () => ({
  ...documentsServiceMocks,
}));

const { runDocumentJanitor } = await import("../documentJanitor.service");

const PRISMA = {} as unknown as PrismaClient;

beforeEach(() => {
  draftIntakeCleanupMocks.sweepStaleIntakeShells.mockResolvedValue({
    deleted: 2,
    failed: 1,
  });
  draftIntakeCleanupMocks.sweepInfectedIntakeShells.mockResolvedValue({
    deleted: 4,
    failed: 5,
  });
  documentsServiceMocks.sweepStalePendingDocuments.mockResolvedValue({
    deleted: 3,
    failed: 8,
  });
  documentsServiceMocks.countStuckScanDocuments.mockResolvedValue(7);
});

describe("runDocumentJanitor", () => {
  it("combines every sweep and the stuck-scan count into a single result", async () => {
    await expect(runDocumentJanitor({ prisma: PRISMA })).resolves.toEqual({
      expiredIntakeShells: 2,
      expiredInfectedIntakeShells: 4,
      expiredPendingDocuments: 3,
      failedIntakeShells: 6,
      failedPendingDocuments: 8,
      stuckScanDocuments: 7,
    });
  });

  it("defaults the staleness cutoff to 2 hours before now", async () => {
    const now = new Date("2026-09-14T12:00:00.000Z");

    await runDocumentJanitor({ prisma: PRISMA, now });

    const expectedCutoff = new Date("2026-09-14T10:00:00.000Z");
    expect(draftIntakeCleanupMocks.sweepStaleIntakeShells).toHaveBeenCalledWith(
      PRISMA,
      expectedCutoff,
    );
    expect(
      documentsServiceMocks.sweepStalePendingDocuments,
    ).toHaveBeenCalledWith(PRISMA, expectedCutoff);
    expect(documentsServiceMocks.countStuckScanDocuments).toHaveBeenCalledWith(
      PRISMA,
      expectedCutoff,
      new Date("2026-09-07T12:00:00.000Z"),
    );
  });

  it("sweeps INFECTED shells only once they are 7 days old", async () => {
    const now = new Date("2026-09-14T12:00:00.000Z");

    await runDocumentJanitor({ prisma: PRISMA, now });

    expect(
      draftIntakeCleanupMocks.sweepInfectedIntakeShells,
    ).toHaveBeenCalledWith(PRISMA, new Date("2026-09-07T12:00:00.000Z"));
  });

  it("honors a custom staleness threshold", async () => {
    const now = new Date("2026-09-14T12:00:00.000Z");
    const olderThanMs = 30 * 60 * 1000; // 30 minutes

    await runDocumentJanitor({ prisma: PRISMA, now, olderThanMs });

    const expectedCutoff = new Date("2026-09-14T11:30:00.000Z");
    expect(draftIntakeCleanupMocks.sweepStaleIntakeShells).toHaveBeenCalledWith(
      PRISMA,
      expectedCutoff,
    );
  });
});
