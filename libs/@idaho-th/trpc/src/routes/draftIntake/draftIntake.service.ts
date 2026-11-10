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

import { TRPCError } from "@trpc/server";

import {
  ApplicationIntakeStatus,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  Prisma,
  type PrismaClient,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  type EligibilityParams,
  extractEligibilityParams,
  type HousingApplicationForm,
  normalizeDefaultValues,
  normalizeEligibilityParams,
} from "~@idaho-th/shared";
import { IDAHO_TH_STATE_CODE } from "~@idaho-th/trpc/auth/constants";
import { getLogger } from "~@idaho-th/trpc/routes/common/logger";
import { segment } from "~@idaho-th/trpc/routes/common/segment";
import type {
  CreateDraftIntakeApplicationInput,
  CreateDraftIntakeApplicationShellInput,
  DocumentScanState,
  DraftIntakeDocumentInput,
  FinalizeDraftIntakeApplicationDataInput,
  SubmitDraftIntakeApplicationInput,
} from "~@idaho-th/trpc/routes/draftIntake/draftIntake.types";
import {
  buildEligibilityWhere,
  type HousingProvider,
  matchProviders,
} from "~@idaho-th/trpc/routes/housing-common/eligibilityEngine";
import { ELIGIBLE_PROVIDER_STAFF_SELECT } from "~@idaho-th/trpc/routes/housing-common/eligibleProvider.selects";
import { handleHousingApplicationWriteError } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import {
  preferredProvidersCreate,
  preferredProvidersReplace,
  splitPreferredProviders,
} from "~@idaho-th/trpc/routes/housing-common/preferredProviders.helpers";
import {
  buildInitialApplicationTimelineEventsCreate,
  recordTimelineEvent,
  withTimelineAnalytics,
} from "~@idaho-th/trpc/routes/timeline/timeline.events";
import { buildApplicationDocumentFileName } from "~@idaho-th/trpc/storage/applicationDocument/applicationDocumentObjectKey.builder";
import { deleteGcsObject, gcsConfig } from "~@idaho-th/trpc/storage/gcs";
import { generateUuid, parseDateString } from "~@idaho-th/trpc/utils/common";
import { formatErrorForLog } from "~@idaho-th/trpc/utils/errorText";
import { delayMs } from "~@idaho-th/trpc/utils/withTimeout";

import { computeFieldOverrides } from "../aiExtractionMetrics/aiExtractionMetrics.service";

const log = getLogger("draftIntake.service");

function formDataRecord(
  formData: Prisma.InputJsonValue,
): Record<string, unknown> {
  if (
    typeof formData === "object" &&
    formData !== null &&
    !Array.isArray(formData)
  ) {
    return formData as Record<string, unknown>;
  }
  return {};
}

function scalarsFromFormData(formData: Prisma.InputJsonValue) {
  const record = formDataRecord(formData);
  const clientName = String(record["clientFullName"] ?? "");
  const idocNumberRaw = record["idocNumber"];
  const idocNumber = typeof idocNumberRaw === "string" ? idocNumberRaw : null;
  const expectedReleaseDate = parseDateString(record["tpdHousingNeededDate"]);

  return { clientName, idocNumber, expectedReleaseDate };
}

function resolveDocumentFileName(fileName?: string): string {
  const trimmed = fileName?.trim();
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }
  return buildApplicationDocumentFileName(
    generateUuid(),
    HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
  );
}

type DraftIntakeApplicationScalars = {
  clientName: string;
  formData: Prisma.InputJsonValue;
  idocNumber: string | null;
  expectedReleaseDate: Date | null;
};

function buildDraftIntakeDocumentCreate(
  staffPseudonymizedId: string,
  document: DraftIntakeDocumentInput,
  documentStatus: HousingApplicationDocumentStatus,
): Prisma.HousingApplicationDocumentCreateWithoutApplicationInput {
  const isConfirmed =
    documentStatus === HousingApplicationDocumentStatus.CONFIRMED;
  return {
    uploadedByType: HousingApplicationDocumentUploader.STAFF,
    uploadedByPseudonymizedId: staffPseudonymizedId,
    documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
    fileName: resolveDocumentFileName(document.fileName),
    bucketName: document.bucketName,
    objectKey: document.objectKey,
    contentType: document.contentType,
    fileSizeBytes: document.fileSizeBytes,
    status: documentStatus,
    ...(isConfirmed ? { confirmedAt: new Date() } : {}),
    // Uploaded to the quarantine bucket like any other document, so it goes
    // through the same ClamAV scan-webhook flow. Only the dev
    // skipDocumentScan escape hatch marks it CLEAN up front, and only once
    // the object is actually confirmed to exist (a PENDING row's object may
    // not have finished uploading yet).
    ...(isConfirmed && gcsConfig.skipDocumentScan
      ? { scanStatus: HousingApplicationDocumentScanStatus.CLEAN }
      : {}),
  };
}

function buildDraftIntakeCreateData(
  applicationId: string,
  staffPseudonymizedId: string,
  scalars: DraftIntakeApplicationScalars,
  document?: DraftIntakeDocumentInput,
  documentStatus: HousingApplicationDocumentStatus = HousingApplicationDocumentStatus.CONFIRMED,
): Prisma.HousingApplicationCreateInput {
  return {
    id: applicationId,
    stateCode: IDAHO_TH_STATE_CODE,
    ...scalars,
    staffApplication: {
      create: {
        staffPseudonymizedId,
        intakeStatus: ApplicationIntakeStatus.DRAFT,
        stage: ApplicationStage.DRAFT,
        subStage: null,
        status: ApplicationStatus.ACTION_NEEDED,
      },
    },
    timelineEvents: {
      create: buildInitialApplicationTimelineEventsCreate(staffPseudonymizedId),
    },
    ...(document
      ? {
          documents: {
            create: buildDraftIntakeDocumentCreate(
              staffPseudonymizedId,
              document,
              documentStatus,
            ),
          },
        }
      : {}),
  };
}

/**
 * Creates the HousingApplication row for the given nested-create data,
 * deleting the uploaded GCS object if the write fails so a failed create
 * never leaves an orphaned document behind.
 */
async function createHousingApplicationRow(
  prisma: PrismaClient,
  createData: Prisma.HousingApplicationCreateInput,
  document?: DraftIntakeDocumentInput,
): Promise<{ applicationId: string; documentId?: string }> {
  try {
    const created = await prisma.housingApplication.create({
      data: createData,
      select: { id: true, documents: { select: { id: true }, take: 1 } },
    });
    return { applicationId: created.id, documentId: created.documents[0]?.id };
  } catch (error) {
    if (document) {
      await deleteGcsObject({
        bucketName: document.bucketName,
        objectKey: document.objectKey,
      }).catch(() => undefined);
    }
    throw error;
  }
}

/**
 * Persists a draft housing application, staff intake row, and optional source
 * document in a single Prisma create (nested writes).
 *
 * @deprecated Legacy single-shot intake path (predates the shell + finalize
 * flow) — do not add new callers.
 */
export async function createDraftIntakeApplication(
  prisma: PrismaClient,
  input: CreateDraftIntakeApplicationInput,
): Promise<{ applicationId: string; documentId?: string }> {
  const { applicationId, staffPseudonymizedId, formData, document } = input;
  const { formData: storedFormData, preferredProviderIds } =
    splitPreferredProviders(formDataRecord(formData));
  const createData = buildDraftIntakeCreateData(
    applicationId,
    staffPseudonymizedId,
    {
      formData: storedFormData as Prisma.InputJsonValue,
      ...scalarsFromFormData(formData),
    },
    document,
  );
  return createHousingApplicationRow(
    prisma,
    {
      ...createData,
      preferredProviders: preferredProvidersCreate(preferredProviderIds),
    },
    document,
  );
}

/**
 * Creates a shell application + PENDING document row right after the
 * quarantine upload, before extraction runs. This must exist before the real
 * ClamAV scan completes: the scan webhook (`applyScanResult` in
 * documents.helpers.ts) only flips an existing PENDING row matched by
 * objectKey. Since a scan of a few-page PDF is fast relative to the ~20s
 * Vertex extraction call, waiting until after extraction to create this row
 * (as the single-shot createDraftIntakeApplication above does) risks the
 * webhook firing first and finding nothing to update.
 */
export async function createDraftIntakeApplicationShell(
  prisma: PrismaClient,
  input: CreateDraftIntakeApplicationShellInput,
): Promise<{ applicationId: string; documentId?: string }> {
  const { applicationId, staffPseudonymizedId, document, documentStatus } =
    input;
  const createData = buildDraftIntakeCreateData(
    applicationId,
    staffPseudonymizedId,
    {
      clientName: "",
      formData: {},
      idocNumber: null,
      expectedReleaseDate: null,
    },
    document,
    documentStatus,
  );
  return createHousingApplicationRow(prisma, createData, document);
}

/**
 * Rejects a second concurrent extraction call for the same shell instead of
 * letting both race to write formData.
 */
export async function claimApplicationForExtraction(
  prisma: PrismaClient,
  applicationId: string,
): Promise<boolean> {
  const result = await prisma.housingApplication.updateMany({
    where: {
      id: applicationId,
      extractionClaimedAt: null,
      formData: { equals: {} },
      staffApplication: {
        intakeStatus: ApplicationIntakeStatus.DRAFT,
        stage: ApplicationStage.DRAFT,
      },
      documents: {
        some: {
          uploadedByType: HousingApplicationDocumentUploader.STAFF,
          documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
          status: HousingApplicationDocumentStatus.CONFIRMED,
          scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
        },
      },
    },
    data: { extractionClaimedAt: new Date() },
  });
  return result.count > 0;
}

const FINALIZE_MAX_ATTEMPTS = 3;
const FINALIZE_RETRY_DELAY_MS = 250;

// Prisma's "Common" connection-level error codes — see
// https://www.prisma.io/docs/orm/reference/error-reference#common. A
// permanent error like P2025 (record not found) will never succeed on
// retry, so only these are worth the delay.
const TRANSIENT_PRISMA_ERROR_CODES = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
]);

function isTransientPrismaError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    TRANSIENT_PRISMA_ERROR_CODES.has(error.code)
  );
}

/**
 * Fills in the real extracted formData on a shell application (see
 * createDraftIntakeApplicationShell) once extraction has completed.
 *
 * Retries a transient write failure rather than losing an already-completed
 * Vertex extraction and forcing the whole scan/order/extract flow to rerun.
 */
export async function finalizeDraftIntakeApplicationData(
  prisma: PrismaClient,
  input: FinalizeDraftIntakeApplicationDataInput,
): Promise<void> {
  const { applicationId, formData } = input;
  const { clientName, idocNumber, expectedReleaseDate } =
    scalarsFromFormData(formData);
  // rawAiResponse keeps the extracted preferredProviders: it's the AI
  // snapshot the submit-time override diff compares against.
  const { formData: storedFormData, preferredProviderIds } =
    splitPreferredProviders(formDataRecord(formData));

  for (let attempt = 1; attempt <= FINALIZE_MAX_ATTEMPTS; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential retry, must attempt in order
      await prisma.housingApplication.update({
        where: { id: applicationId },
        data: {
          clientName,
          formData: storedFormData as Prisma.InputJsonValue,
          preferredProviders: preferredProvidersReplace(preferredProviderIds),
          rawAiResponse: formData,
          idocNumber,
          expectedReleaseDate,
        },
      });
      return;
    } catch (error) {
      if (attempt === FINALIZE_MAX_ATTEMPTS || !isTransientPrismaError(error)) {
        throw error;
      }
      // eslint-disable-next-line no-await-in-loop -- sequential retry, must attempt in order
      await delayMs(FINALIZE_RETRY_DELAY_MS * attempt);
    }
  }
}

// Shell-cleanup helpers live in draftIntake.cleanup.ts (Prisma-only, so
// lightweight callers like the scan webhook route can use them without
// pulling in the PDF pipeline). Re-exported here for existing callers.
export {
  cleanupIntakeShell,
  cleanupIntakeShellByObjectKey,
  deleteDraftIntakeApplicationShell,
  isEmptyIntakeShell,
  tryCleanupIntakeShell,
  tryCleanupIntakeShellByObjectKey,
} from "~@idaho-th/trpc/routes/draftIntake/draftIntake.cleanup";

/**
 * Looks up a document's current scan verdict and bucket by objectKey (the
 * stable identifier across the quarantine -> clean bucket move; see the
 * comment on HousingApplicationDocument.bucketName in schema.prisma).
 */
export async function getDocumentScanState(
  prisma: PrismaClient,
  objectKey: string,
): Promise<DocumentScanState | null> {
  // findFirst, not findUnique: objectKey isn't unique anymore, but at scan time
  // only one row has this key (duplicates are created later, already CLEAN).
  // This holds because a duplicate can only be created from an already-
  // CONFIRMED (already-scanned) document, so the scan webhook for a given key
  // always resolves before any duplicate reusing that key can exist.
  return prisma.housingApplicationDocument.findFirst({
    where: { objectKey },
    select: { scanStatus: true, bucketName: true },
  });
}

async function resolveEligibleProviderCreates(
  prisma: PrismaClient,
  eligibilityParams: EligibilityParams,
) {
  const normalizedParams = normalizeEligibilityParams(eligibilityParams);
  const rawProviders = await prisma.housingProvider.findMany({
    where: buildEligibilityWhere(normalizedParams),
    include: { locations: true },
    orderBy: { name: "asc" },
  });

  return matchProviders(
    rawProviders as HousingProvider[],
    normalizedParams,
  ).map(({ provider, location }) => ({
    providerId: provider.id,
    providerLocationId: location.id,
  }));
}

async function recordSubmittedOverrides(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: SubmitDraftIntakeApplicationInput,
): Promise<void> {
  try {
    const { rawAiResponse } = await prisma.housingApplication.findUniqueOrThrow(
      {
        where: { id: input.id },
        select: { rawAiResponse: true },
      },
    );

    if (!rawAiResponse) return;

    const { overriddenFieldCount, overriddenFields } = computeFieldOverrides(
      normalizeDefaultValues(
        rawAiResponse as unknown as HousingApplicationForm,
      ),
      input.formData,
    );

    await prisma.aiExtractionMetrics.updateMany({
      where: { applicationId: input.id },
      data: {
        submittedAt: new Date(),
        overriddenFieldCount,
        overriddenFields,
      },
    });

    segment.track("backend_idaho_th_application_override_recorded", {
      applicationId: input.id,
      overriddenFieldCount,
      staffPseudonymizedId,
    });
  } catch (error) {
    log.error("Failed to record AI extraction overrides", {
      applicationId: input.id,
      ...formatErrorForLog(error),
    });
  }
}

/**
 * Confirms a draft intake: updates application data, replaces eligible
 * providers, marks the staff intake as SUBMITTED, and advances stage from
 * DRAFT to APPLICATION (PROVIDER_REVIEW / ACTION_NEEDED) so the case can
 * enter the normal provider-matching workflow.
 */
export async function submitDraftIntakeApplication(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: SubmitDraftIntakeApplicationInput,
) {
  const owned = await prisma.staffHousingApplication.findFirst({
    where: {
      applicationId: input.id,
      staffPseudonymizedId,
      intakeStatus: ApplicationIntakeStatus.DRAFT,
    },
    select: { id: true },
  });

  if (!owned) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Draft housing application not found",
    });
  }

  const { clientName, idocNumber, expectedReleaseDate } = scalarsFromFormData(
    input.formData,
  );
  const eligibleCreates = await resolveEligibleProviderCreates(
    prisma,
    extractEligibilityParams(input.formData),
  );
  const staff = await prisma.housingStaff.findUnique({
    where: { pseudonymizedId: staffPseudonymizedId },
    select: { email: true },
  });
  const { formData, preferredProviderIds } = splitPreferredProviders({
    ...input.formData,
    cmEmailOnFile: staff?.email ?? null,
  });

  const updated = await withTimelineAnalytics(prisma, async (tx) => {
    const flipped = await tx.staffHousingApplication.updateMany({
      where: {
        applicationId: input.id,
        staffPseudonymizedId,
        intakeStatus: ApplicationIntakeStatus.DRAFT,
      },
      data: {
        intakeStatus: ApplicationIntakeStatus.SUBMITTED,
        stage: ApplicationStage.APPLICATION,
        subStage: ApplicationSubStage.PROVIDER_REVIEW,
        status: ApplicationStatus.ACTION_NEEDED,
      },
    });

    if (flipped.count !== 1) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Draft housing application has already been submitted",
      });
    }

    await recordTimelineEvent(tx, {
      applicationId: input.id,
      actor: {
        role: TimelineActorRole.SYSTEM,
      },
      type: TimelineEventType.STAGE_ADVANCED,
      fromStage: ApplicationStage.DRAFT,
      toStage: ApplicationStage.APPLICATION,
    });

    await tx.eligibleHousingProvider.deleteMany({
      where: { applicationId: { equals: input.id } },
    });

    return tx.housingApplication.update({
      where: { id: input.id },
      data: {
        clientName,
        idocNumber,
        expectedReleaseDate,
        formData: formData as Prisma.InputJsonValue,
        preferredProviders: preferredProvidersReplace(preferredProviderIds),
        eligibleProviders: {
          create: eligibleCreates,
        },
      },
      include: {
        staffApplication: true,
        eligibleProviders: {
          select: ELIGIBLE_PROVIDER_STAFF_SELECT,
        },
      },
    });
  }).catch(handleHousingApplicationWriteError);

  void recordSubmittedOverrides(prisma, staffPseudonymizedId, input);

  return updated;
}
