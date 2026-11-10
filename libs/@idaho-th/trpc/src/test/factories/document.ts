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
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type Prisma,
  type PrismaClient,
} from "~@idaho-th/prisma/client";

import { TEST_DATES, TEST_STAFF_PSEUDONYMIZED_ID, uniqueId } from "./constants";

type HousingApplicationDocumentInput = Pick<
  Prisma.HousingApplicationDocumentUncheckedCreateInput,
  "applicationId"
> &
  Partial<Prisma.HousingApplicationDocumentUncheckedCreateInput>;

/** Defaults to the confirmed, virus-scanned handwritten source PDF. */
export function createHousingApplicationDocument(
  prismaClient: PrismaClient,
  { applicationId, ...overrides }: HousingApplicationDocumentInput,
) {
  return prismaClient.housingApplicationDocument.create({
    data: {
      applicationId,
      uploadedByType: HousingApplicationDocumentUploader.STAFF,
      uploadedByPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      fileName: "handwritten.pdf",
      bucketName: "test-clean-bucket",
      objectKey: `${uniqueId("applications/handwritten-source")}.pdf`,
      contentType: "application/pdf",
      fileSizeBytes: 1024,
      status: HousingApplicationDocumentStatus.CONFIRMED,
      confirmedAt: TEST_DATES.DOCUMENT_CONFIRMED,
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      ...overrides,
    },
  });
}
