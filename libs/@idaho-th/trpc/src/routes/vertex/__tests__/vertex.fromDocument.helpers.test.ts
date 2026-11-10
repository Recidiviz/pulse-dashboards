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

import { describe, expect, it, vi } from "vitest";

import {
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  type PrismaClient,
} from "~@idaho-th/prisma/client";

import { findCleanStaffDocumentForExtraction } from "../vertex.fromDocument.helpers";

describe("findCleanStaffDocumentForExtraction", () => {
  it("scopes the lookup to CLEAN, staff-uploaded, CONFIRMED, HANDWRITTEN_SOURCE documents owned by the caller", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const prisma = {
      housingApplicationDocument: { findFirst },
    } as unknown as PrismaClient;

    await findCleanStaffDocumentForExtraction(prisma, "document-1", "staff-1");

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: "document-1",
        scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
        uploadedByType: HousingApplicationDocumentUploader.STAFF,
        status: HousingApplicationDocumentStatus.CONFIRMED,
        documentType: HousingApplicationDocumentType.HANDWRITTEN_SOURCE,
        application: {
          staffApplication: { staffPseudonymizedId: "staff-1" },
        },
      },
      select: {
        applicationId: true,
        bucketName: true,
        objectKey: true,
        fileName: true,
      },
    });
  });
});
