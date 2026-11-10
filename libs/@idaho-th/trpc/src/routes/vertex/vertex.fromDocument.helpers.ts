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
  type PrismaClient,
} from "~@idaho-th/prisma/client";
import type { CleanStaffDocumentForExtraction } from "~@idaho-th/trpc/routes/vertex/vertex.types";

export async function findCleanStaffDocumentForExtraction(
  prisma: PrismaClient,
  documentId: string,
  staffPseudonymizedId: string,
): Promise<CleanStaffDocumentForExtraction | null> {
  return prisma.housingApplicationDocument.findFirst({
    where: {
      id: documentId,
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      uploadedByType: HousingApplicationDocumentUploader.STAFF,
      status: HousingApplicationDocumentStatus.CONFIRMED,
      documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
      application: { staffApplication: { staffPseudonymizedId } },
    },
    select: {
      applicationId: true,
      bucketName: true,
      objectKey: true,
      fileName: true,
    },
  });
}
