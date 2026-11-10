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

// Failure-path cleanup for vertex-intake shell applications. These helpers are
// intentionally kept in their own module (rather than draftIntake.service) so
// they can be imported by lightweight callers — e.g. the ClamAV scan webhook
// route — without pulling in the heavy PDF-processing pipeline
// (preparePdfSafely -> pdfSorterPool, which uses `import.meta`). That subtree
// is ESM-only and cannot be typechecked under the server's commonjs spec
// config, so keeping this module free of that pipeline avoids dragging it into
// those compiles.

import {
  ApplicationIntakeStatus,
  ApplicationStage,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type Prisma,
  type PrismaClient,
} from "~@idaho-th/prisma/client";
import { getLogger } from "~@idaho-th/trpc/routes/common/logger";
import {
  deleteGcsObject,
  isGcsNotFoundError,
} from "~@idaho-th/trpc/storage/gcs";
import { formatErrorForLog } from "~@idaho-th/trpc/utils/errorText";

const log = getLogger("draftIntake.cleanup");

/**
 * Unconditionally deletes a housing application (and cascaded document /
 * staffApplication / timelineEvent rows). Prefer cleanupIntakeShell when the
 * row may already have been populated by a concurrent finalize.
 */
export async function deleteDraftIntakeApplicationShell(
  prisma: PrismaClient,
  applicationId: string,
): Promise<void> {
  await prisma.housingApplication.delete({ where: { id: applicationId } });
}

export function isEmptyIntakeShell(formData: unknown): boolean {
  return (
    typeof formData === "object" &&
    formData !== null &&
    !Array.isArray(formData) &&
    Object.keys(formData).length === 0
  );
}

/**
 * Deletes a vertex-intake shell only when it is still an empty DRAFT owned by
 * the requesting staff member. Returns false when no matching shell exists or
 * extraction has already populated formData.
 *
 * Uses a single conditional deleteMany (ownership + DRAFT + formData = {}) so
 * a concurrent finalizeDraftIntakeApplicationData cannot populate formData
 * between a separate empty-check and delete.
 */
export async function cleanupIntakeShell(
  prisma: PrismaClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<boolean> {
  const result = await prisma.housingApplication.deleteMany({
    where: {
      id: applicationId,
      formData: { equals: {} },
      staffApplication: {
        staffPseudonymizedId,
        intakeStatus: ApplicationIntakeStatus.DRAFT,
        stage: ApplicationStage.DRAFT,
      },
    },
  });
  return result.count > 0;
}

/**
 * Best-effort wrapper for failure-path cleanup. Always logs cleanup failures
 * via the module logger, then swallows so they never mask the original
 * upload/extraction error. Pass onError to add caller-specific context (it
 * runs after the default log).
 */
export async function tryCleanupIntakeShell(
  prisma: PrismaClient,
  applicationId: string | undefined,
  staffPseudonymizedId: string,
  onError?: (error: unknown) => void,
): Promise<void> {
  if (!applicationId) return;

  try {
    await cleanupIntakeShell(prisma, applicationId, staffPseudonymizedId);
  } catch (error) {
    log.error("Failed to clean up empty vertex intake shell", {
      applicationId,
      staffPseudonymizedId,
      ...formatErrorForLog(error),
    });
    onError?.(error);
  }
}

/**
 * Deletes an empty vertex-intake shell matched by a document's objectKey.
 * Prefer applicationId-keyed cleanupIntakeShell / cancelUpload when the caller
 * already has the application id (e.g. after getScanStatus returns INFECTED).
 */
export async function cleanupIntakeShellByObjectKey(
  prisma: PrismaClient,
  objectKey: string,
): Promise<boolean> {
  // findFirst, not findUnique: objectKey isn't unique anymore, but an INFECTED
  // source is caught before it can be CONFIRMED (and only CONFIRMED sources are
  // duplicable), so exactly one row ever has this key here.
  const document = await prisma.housingApplicationDocument.findFirst({
    where: {
      objectKey: { equals: objectKey },
      uploadedByType: HousingApplicationDocumentUploader.STAFF,
      documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
    },
    select: {
      applicationId: true,
      uploadedByPseudonymizedId: true,
    },
  });

  if (!document) {
    return false;
  }

  return cleanupIntakeShell(
    prisma,
    document.applicationId,
    document.uploadedByPseudonymizedId,
  );
}

/**
 * Best-effort objectKey-keyed cleanup. Always logs, then swallows, so a
 * cleanup failure never masks the caller's primary outcome.
 */
export async function tryCleanupIntakeShellByObjectKey(
  prisma: PrismaClient,
  objectKey: string,
  onError?: (error: unknown) => void,
): Promise<void> {
  try {
    await cleanupIntakeShellByObjectKey(prisma, objectKey);
  } catch (error) {
    log.error("Failed to clean up empty vertex intake shell by objectKey", {
      objectKey,
      ...formatErrorForLog(error),
    });
    onError?.(error);
  }
}

// Bounds a single sweep so an unexpectedly large backlog can't blow past the
// job's own timeout in one run; any remainder is picked up next run.
const INTAKE_SHELL_SWEEP_BATCH_SIZE = 500;

/**
 * Deletes the shell's GCS objects before the shell: a shell whose object
 * delete failed stays put and is retried next run, whereas deleting the row
 * first would cascade away the only record of where its objects live.
 */
async function sweepIntakeShell(
  prisma: PrismaClient,
  applicationId: string,
  shellWhere: Prisma.HousingApplicationWhereInput,
): Promise<"deleted" | "skipped" | "failed"> {
  let documents: {
    bucketName: string;
    objectKey: string;
    scanStatus: HousingApplicationDocumentScanStatus;
  }[];
  try {
    // A concurrent extraction may have populated formData since the batch
    // find; re-reading also picks up the shell's current documents.
    const shell = await prisma.housingApplication.findFirst({
      where: { id: applicationId, ...shellWhere },
      select: {
        documents: {
          select: { bucketName: true, objectKey: true, scanStatus: true },
        },
      },
    });
    if (!shell) return "skipped";
    documents = shell.documents;
  } catch (error) {
    log.error("Failed to re-check stale intake shell", {
      applicationId,
      ...formatErrorForLog(error),
    });
    return "failed";
  }

  for (const document of documents) {
    // Quarantined objects are kept for investigation until the quarantine
    // bucket's lifecycle expires them.
    if (document.scanStatus === HousingApplicationDocumentScanStatus.INFECTED) {
      continue;
    }
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential, low-volume sweep
      await deleteGcsObject(document);
    } catch (error) {
      if (!isGcsNotFoundError(error)) {
        log.error("Failed to delete GCS object for stale intake shell", {
          applicationId,
          objectKey: document.objectKey,
          ...formatErrorForLog(error),
        });
        return "failed";
      }
    }
  }

  try {
    const result = await prisma.housingApplication.deleteMany({
      where: { id: applicationId, ...shellWhere },
    });
    if (result.count > 0) return "deleted";
    // Changed in the gap between the re-check and this delete, after its
    // objects were already gone.
    log.error("Stale intake shell changed after its GCS objects were deleted", {
      applicationId,
    });
    return "failed";
  } catch (error) {
    log.error("Failed to delete stale intake shell", {
      applicationId,
      ...formatErrorForLog(error),
    });
    return "failed";
  }
}

async function sweepIntakeShells(
  prisma: PrismaClient,
  shellWhere: Prisma.HousingApplicationWhereInput,
): Promise<{ deleted: number; failed: number }> {
  const shells = await prisma.housingApplication.findMany({
    where: shellWhere,
    select: { id: true },
    take: INTAKE_SHELL_SWEEP_BATCH_SIZE,
  });

  let deleted = 0;
  let failed = 0;

  for (const shell of shells) {
    // eslint-disable-next-line no-await-in-loop -- sequential, low-volume sweep
    const outcome = await sweepIntakeShell(prisma, shell.id, shellWhere);
    if (outcome === "deleted") deleted += 1;
    if (outcome === "failed") failed += 1;
  }

  return { deleted, failed };
}

/**
 * Deletes empty DRAFT shells that never resolved through the normal
 * success/failure paths (e.g. the server process was killed mid-extraction),
 * so they don't sit in DRAFT indefinitely. Every other failure path already
 * cleans up its own shell as it happens; this only catches what those missed.
 */
export async function sweepStaleIntakeShells(
  prisma: PrismaClient,
  olderThan: Date,
): Promise<{ deleted: number; failed: number }> {
  const staleShellWhere: Prisma.HousingApplicationWhereInput = {
    formData: { equals: {} },
    staffApplication: {
      intakeStatus: ApplicationIntakeStatus.DRAFT,
      stage: ApplicationStage.DRAFT,
    },
    AND: [
      {
        // A never-claimed shell is stale by creation time; a claimed one is
        // only stale once the claim itself is old, so an extraction in flight
        // right now (claimed recently) is never swept out from under it.
        OR: [
          { extractionClaimedAt: null, createdAt: { lt: olderThan } },
          { extractionClaimedAt: { lt: olderThan } },
        ],
      },
      {
        OR: [
          // INFECTED shells are left to sweepInfectedIntakeShells.
          {
            documents: {
              some: {
                uploadedByType: HousingApplicationDocumentUploader.STAFF,
                documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
              },
              none: {
                scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
              },
            },
          },
          // Every shell is created with its source document, so one with none
          // left is an orphan.
          { documents: { none: {} } },
        ],
      },
    ],
  };

  return sweepIntakeShells(prisma, staleShellWhere);
}

/**
 * Empty DRAFT shells whose source scanned INFECTED, which the client cancels
 * after showing the verdict — unless the tab closed first. The quarantined
 * object itself is left to the quarantine bucket's lifecycle.
 */
export async function sweepInfectedIntakeShells(
  prisma: PrismaClient,
  olderThan: Date,
): Promise<{ deleted: number; failed: number }> {
  return sweepIntakeShells(prisma, {
    formData: { equals: {} },
    staffApplication: {
      intakeStatus: ApplicationIntakeStatus.DRAFT,
      stage: ApplicationStage.DRAFT,
    },
    documents: {
      some: { scanStatus: HousingApplicationDocumentScanStatus.INFECTED },
    },
    createdAt: { lt: olderThan },
  });
}
