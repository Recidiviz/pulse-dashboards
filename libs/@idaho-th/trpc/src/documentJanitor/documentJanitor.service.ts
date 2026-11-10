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
import {
  countStuckScanDocuments,
  sweepStalePendingDocuments,
} from "~@idaho-th/trpc/routes/documents/documents.service";
import {
  sweepInfectedIntakeShells,
  sweepStaleIntakeShells,
} from "~@idaho-th/trpc/routes/draftIntake/draftIntake.cleanup";

// Even the slowest legitimate extraction (PDF ordering + Vertex, with
// retries) finishes in well under 2 minutes, so this gives large margin
// against sweeping a request that's still genuinely in flight.
const DEFAULT_STALE_AFTER_MS = 2 * 60 * 60 * 1000;

// The client cancels an INFECTED shell as soon as it shows the verdict, so a
// week only ever catches the ones whose tab closed first.
const INFECTED_SHELL_STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

// Staging holds documents from before scanning existed that will never get a
// verdict; a lookback keeps them from raising the stuck-scan alert forever
// while still covering a scan pipeline that is broken right now.
const STUCK_SCAN_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

export type DocumentJanitorResult = {
  expiredIntakeShells: number;
  expiredInfectedIntakeShells: number;
  expiredPendingDocuments: number;
  failedIntakeShells: number;
  failedPendingDocuments: number;
  stuckScanDocuments: number;
};

export type DocumentJanitorDeps = {
  prisma: PrismaClient;
  now?: Date;
  olderThanMs?: number;
};

/**
 * Catches DRAFT shells and PENDING uploads that never resolved through their
 * normal completion/failure paths (a killed process, a dropped connection) —
 * every other path already cleans up after itself — and counts confirmed
 * uploads still waiting on a scan verdict.
 */
export async function runDocumentJanitor(
  deps: DocumentJanitorDeps,
): Promise<DocumentJanitorResult> {
  const { prisma } = deps;
  const now = deps.now ?? new Date();
  const olderThanMs = deps.olderThanMs ?? DEFAULT_STALE_AFTER_MS;
  const olderThan = new Date(now.getTime() - olderThanMs);

  const shells = await sweepStaleIntakeShells(prisma, olderThan);
  const infectedShells = await sweepInfectedIntakeShells(
    prisma,
    new Date(now.getTime() - INFECTED_SHELL_STALE_AFTER_MS),
  );
  const pendingDocuments = await sweepStalePendingDocuments(prisma, olderThan);
  const stuckScanDocuments = await countStuckScanDocuments(
    prisma,
    olderThan,
    new Date(now.getTime() - STUCK_SCAN_LOOKBACK_MS),
  );

  return {
    expiredIntakeShells: shells.deleted,
    expiredInfectedIntakeShells: infectedShells.deleted,
    expiredPendingDocuments: pendingDocuments.deleted,
    failedIntakeShells: shells.failed + infectedShells.failed,
    failedPendingDocuments: pendingDocuments.failed,
    stuckScanDocuments,
  };
}
