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
  ApplicationIntakeStatus,
  ApplicationStage,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type PrismaClient,
} from "~@idaho-th/prisma/client";
import {
  createHousingApplicationDocument,
  seedApplicationWithProviders,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";

type VertexIntakeShellOptions = {
  staffPseudonymizedId?: string;
};

/**
 * An empty vertex-intake shell application (DRAFT/DRAFT, formData = {}) — the
 * state requestVertexUpload leaves behind before extraction/finalize runs,
 * and the only shape cancelVertexUpload's cleanupIntakeShell will delete.
 */
export async function seedVertexIntakeShell(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
  }: VertexIntakeShellOptions = {},
) {
  const { application, staffApplication } = await seedApplicationWithProviders(
    prismaClient,
    {
      application: { formData: {} },
      staffApplication: {
        staffPseudonymizedId,
        intakeStatus: ApplicationIntakeStatus.DRAFT,
        stage: ApplicationStage.DRAFT,
      },
    },
  );

  return { application, staffApplication };
}

type VertexPendingDocumentOptions = VertexIntakeShellOptions & {
  uploadedByPseudonymizedId?: string;
};

/** A PENDING handwritten-source document on a fresh vertex-intake shell. */
export async function seedVertexPendingDocument(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
    uploadedByPseudonymizedId = staffPseudonymizedId,
  }: VertexPendingDocumentOptions = {},
) {
  const { application, staffApplication } = await seedVertexIntakeShell(
    prismaClient,
    { staffPseudonymizedId },
  );
  const document = await createHousingApplicationDocument(prismaClient, {
    applicationId: application.id,
    uploadedByType: HousingApplicationDocumentUploader.STAFF,
    uploadedByPseudonymizedId,
    documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
    status: HousingApplicationDocumentStatus.PENDING,
    confirmedAt: null,
    scanStatus: HousingApplicationDocumentScanStatus.PENDING,
    bucketName: "test-bucket",
  });

  return { application, staffApplication, document };
}

/**
 * A CONFIRMED handwritten-source document on a vertex-intake shell, ready for
 * scan-status polling. Ownership for getScanStatus flows through the
 * application's staffApplication row, not the document's uploader field.
 */
export async function seedVertexConfirmedDocument(
  prismaClient: PrismaClient,
  {
    staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
  }: VertexIntakeShellOptions = {},
) {
  const { application, staffApplication } = await seedVertexIntakeShell(
    prismaClient,
    { staffPseudonymizedId },
  );
  const document = await createHousingApplicationDocument(prismaClient, {
    applicationId: application.id,
    uploadedByType: HousingApplicationDocumentUploader.STAFF,
    uploadedByPseudonymizedId: staffPseudonymizedId,
    documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
    status: HousingApplicationDocumentStatus.CONFIRMED,
    scanStatus: HousingApplicationDocumentScanStatus.PENDING,
  });

  return { application, staffApplication, document };
}
