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
  HousingApplicationDocumentUploader,
} from "~@idaho-th/prisma/client";
import { DOCUMENT_UPLOAD_ERROR } from "~@idaho-th/shared";
import {
  providerCaller,
  staffCaller,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import { createHousingApplicationDocument } from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  DAILY_UPLOAD_QUOTA_PER_UPLOADER,
  startOfUtcCalendarDay,
} from "../documents.constants";
import {
  seedDocumentsProviderUser,
  seedProviderDocumentsApplication,
  seedStaffDocumentsApplication,
} from "./documents.fixtures";

// GCS is the only external boundary; everything else runs against the real
// service and database so the allowance is enforced the way a request enforces
// it. Only the network-calling exports are stubbed — gcsConfig and the
// constants stay real, as other routers pulled in via appRouter import them.
const gcsMocks = vi.hoisted(() => ({
  generateResumableUploadUrl: vi.fn(),
  deleteGcsObject: vi.fn(),
  getGcsObjectMetadata: vi.fn(),
  downloadGcsObjectHead: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/storage/gcs", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~@idaho-th/trpc/storage/gcs")>();
  return {
    ...actual,
    generateResumableUploadUrl: gcsMocks.generateResumableUploadUrl,
    deleteGcsObject: gcsMocks.deleteGcsObject,
    getGcsObjectMetadata: gcsMocks.getGcsObjectMetadata,
    downloadGcsObjectHead: gcsMocks.downloadGcsObjectHead,
  };
});

/** Leading bytes of a real PDF, so magic-byte verification passes. */
const PDF_HEAD_BYTES = Buffer.from([
  0x25,
  0x50,
  0x44,
  0x46,
  ...Array(12).fill(0),
]);

const COLLEAGUE_PSEUDONYMIZED_ID = "provider-2";
const OTHER_STAFF_PSEUDONYMIZED_ID = "staff-2";

beforeEach(() => {
  gcsMocks.generateResumableUploadUrl.mockResolvedValue("https://signed-url");
  gcsMocks.deleteGcsObject.mockResolvedValue(undefined);
  gcsMocks.getGcsObjectMetadata.mockResolvedValue({ size: "1024" });
  gcsMocks.downloadGcsObjectHead.mockResolvedValue(PDF_HEAD_BYTES);
});

/** One organization on one application, with two people assigned to it. */
async function seedHousingProviderWithColleagues() {
  const seeded = await seedProviderDocumentsApplication(testPrismaClient);
  await seedDocumentsProviderUser(testPrismaClient, {
    providerId: seeded.housingProvider.id,
  });
  await seedDocumentsProviderUser(testPrismaClient, {
    providerId: seeded.housingProvider.id,
    pseudonymizedId: COLLEAGUE_PSEUDONYMIZED_ID,
  });
  return seeded;
}

/**
 * Confirmed uploads already made today, as the organization's own documents:
 * `confirmedAt` is now, because the allowance only counts the current UTC day.
 */
function spendHousingProviderAllowance(
  applicationId: string,
  providerId: string,
  count: number,
  uploadedByPseudonymizedId = TEST_PROVIDER_PSEUDONYMIZED_ID,
) {
  return Promise.all(
    Array.from({ length: count }, () =>
      createHousingApplicationDocument(testPrismaClient, {
        applicationId,
        documentType: HousingApplicationDocumentType.ATTACHMENT,
        uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
        uploadedByPseudonymizedId,
        scopedProviderId: providerId,
        confirmedAt: new Date(),
      }),
    ),
  );
}

function spendStaffAllowance(
  applicationId: string,
  staffPseudonymizedId: string,
  count: number,
) {
  return Promise.all(
    Array.from({ length: count }, () =>
      createHousingApplicationDocument(testPrismaClient, {
        applicationId,
        documentType: HousingApplicationDocumentType.ATTACHMENT,
        uploadedByType: HousingApplicationDocumentUploader.STAFF,
        uploadedByPseudonymizedId: staffPseudonymizedId,
        scopedProviderId: null,
        confirmedAt: new Date(),
      }),
    ),
  );
}

function requestProviderUpload(
  applicationId: string,
  providerPseudonymizedId: string,
) {
  return providerCaller({
    providerPseudonymizedId,
  }).documents.requestUploadForProvider({
    applicationId,
    fileName: "proof.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
  });
}

function requestStaffUpload(
  applicationId: string,
  staffPseudonymizedId: string,
) {
  return staffCaller({ staffPseudonymizedId }).documents.requestUploadForStaff({
    applicationId,
    fileName: "notes.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
  });
}

/** What the organization has actually spent, read back from the rows. */
function countHousingProviderUploadsToday(providerId: string) {
  return testPrismaClient.housingApplicationDocument.count({
    where: {
      scopedProviderId: providerId,
      status: HousingApplicationDocumentStatus.CONFIRMED,
      confirmedAt: { gte: startOfUtcCalendarDay() },
    },
  });
}

const QUOTA_EXCEEDED = {
  code: "TOO_MANY_REQUESTS",
  message: DOCUMENT_UPLOAD_ERROR.DAILY_UPLOAD_QUOTA_EXCEEDED,
};

describe("daily upload allowance", () => {
  it("is spent jointly by colleagues at one provider", async () => {
    const { application, housingProvider } =
      await seedHousingProviderWithColleagues();
    await spendHousingProviderAllowance(
      application.id,
      housingProvider.id,
      DAILY_UPLOAD_QUOTA_PER_UPLOADER,
    );

    await expect(
      requestProviderUpload(application.id, COLLEAGUE_PSEUDONYMIZED_ID),
    ).rejects.toMatchObject(QUOTA_EXCEEDED);
  });

  it("still admits a colleague while the provider is below the allowance", async () => {
    const { application, housingProvider } =
      await seedHousingProviderWithColleagues();
    await spendHousingProviderAllowance(
      application.id,
      housingProvider.id,
      DAILY_UPLOAD_QUOTA_PER_UPLOADER - 1,
    );

    await expect(
      requestProviderUpload(application.id, COLLEAGUE_PSEUDONYMIZED_ID),
    ).resolves.toMatchObject({ uploadUrl: "https://signed-url" });
  });

  it("is not consumed by another provider's uploads", async () => {
    const spent = await seedProviderDocumentsApplication(testPrismaClient);
    await spendHousingProviderAllowance(
      spent.application.id,
      spent.housingProvider.id,
      DAILY_UPLOAD_QUOTA_PER_UPLOADER,
      COLLEAGUE_PSEUDONYMIZED_ID,
    );

    const untouched = await seedProviderDocumentsApplication(testPrismaClient);
    await seedDocumentsProviderUser(testPrismaClient, {
      providerId: untouched.housingProvider.id,
    });

    await expect(
      requestProviderUpload(
        untouched.application.id,
        TEST_PROVIDER_PSEUDONYMIZED_ID,
      ),
    ).resolves.toMatchObject({ uploadUrl: "https://signed-url" });
    await expect(
      countHousingProviderUploadsToday(untouched.housingProvider.id),
    ).resolves.toBe(0);
  });

  // The lock matters as much as the count: keyed on the person, two
  // colleagues take different locks, both read the same pre-confirm total and
  // both commit — leaving the organization one over its allowance.
  it("cannot be exceeded by two colleagues confirming at the same moment", async () => {
    const { application, housingProvider } =
      await seedHousingProviderWithColleagues();
    await spendHousingProviderAllowance(
      application.id,
      housingProvider.id,
      DAILY_UPLOAD_QUOTA_PER_UPLOADER - 1,
    );

    // Both uploads are requested while one place is left, so each caller holds
    // a pending document it is entitled to confirm.
    const mine = await requestProviderUpload(
      application.id,
      TEST_PROVIDER_PSEUDONYMIZED_ID,
    );
    const theirs = await requestProviderUpload(
      application.id,
      COLLEAGUE_PSEUDONYMIZED_ID,
    );

    const outcomes = await Promise.allSettled([
      providerCaller({
        providerPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      }).documents.confirmUploadForProvider({ documentId: mine.documentId }),
      providerCaller({
        providerPseudonymizedId: COLLEAGUE_PSEUDONYMIZED_ID,
      }).documents.confirmUploadForProvider({ documentId: theirs.documentId }),
    ]);

    expect(
      outcomes.filter((outcome) => outcome.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      outcomes.filter((outcome) => outcome.status === "rejected"),
    ).toMatchObject([{ reason: QUOTA_EXCEEDED }]);
    await expect(
      countHousingProviderUploadsToday(housingProvider.id),
    ).resolves.toBe(DAILY_UPLOAD_QUOTA_PER_UPLOADER);
  });

  it("stays personal for staff, who have no provider to share it with", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    await spendStaffAllowance(
      application.id,
      TEST_STAFF_PSEUDONYMIZED_ID,
      DAILY_UPLOAD_QUOTA_PER_UPLOADER,
    );
    const other = await seedStaffDocumentsApplication(testPrismaClient, {
      staffPseudonymizedId: OTHER_STAFF_PSEUDONYMIZED_ID,
    });

    await expect(
      requestStaffUpload(application.id, TEST_STAFF_PSEUDONYMIZED_ID),
    ).rejects.toMatchObject(QUOTA_EXCEEDED);
    await expect(
      requestStaffUpload(other.application.id, OTHER_STAFF_PSEUDONYMIZED_ID),
    ).resolves.toMatchObject({ uploadUrl: "https://signed-url" });
  });
});
