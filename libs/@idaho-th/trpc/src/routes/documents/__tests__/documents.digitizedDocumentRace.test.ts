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
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
} from "~@idaho-th/prisma/client";
import {
  staffCaller,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedStaffDocumentsApplication } from "./documents.fixtures";

const gcsMocks = vi.hoisted(() => ({
  generateResumableUploadUrl: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/storage/gcs", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~@idaho-th/trpc/storage/gcs")>();
  return {
    ...actual,
    generateResumableUploadUrl: gcsMocks.generateResumableUploadUrl,
  };
});

function createBarrier(count: number) {
  let release: () => void;
  const everyoneArrived = new Promise<void>((resolve) => {
    release = resolve;
  });
  let arrived = 0;
  return async () => {
    arrived += 1;
    if (arrived >= count) release();
    await everyoneArrived;
  };
}

beforeEach(() => {
  const barrier = createBarrier(2);
  gcsMocks.generateResumableUploadUrl.mockImplementation(async () => {
    await barrier();
    return "https://signed-url";
  });
});

function requestDigitizedUpload(applicationId: string) {
  return staffCaller({
    staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
  }).documents.requestDigitizedUploadForStaff({
    applicationId,
    fileName: "Jane Doe_digitized-application.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
  });
}

function countDigitizedDocuments(applicationId: string) {
  return testPrismaClient.housingApplicationDocument.count({
    where: {
      applicationId,
      documentType: HousingApplicationDocumentType.DIGITIZED,
      status: { not: HousingApplicationDocumentStatus.REJECTED },
    },
  });
}

describe("one-digitized-document limit", () => {
  it("cannot be beaten by two concurrent requests for the same application", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);

    const outcomes = await Promise.allSettled([
      requestDigitizedUpload(application.id),
      requestDigitizedUpload(application.id),
    ]);

    expect(
      outcomes.filter((outcome) => outcome.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      outcomes.filter((outcome) => outcome.status === "rejected"),
    ).toMatchObject([
      {
        reason: {
          code: "BAD_REQUEST",
          message: "This application already has a digitized document",
        },
      },
    ]);
    await expect(countDigitizedDocuments(application.id)).resolves.toBe(1);
  });
});
