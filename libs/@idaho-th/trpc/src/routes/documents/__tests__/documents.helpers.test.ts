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

import { describe, expect, it } from "vitest";

import {
  ApplicationStage,
  HousingApplicationDocumentScanStatus,
  HousingApplicationDocumentStatus,
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  createHousingApplicationDocument,
  createHousingProvider,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  findProviderDocumentForScanStatus,
  findProviderDownloadableDocument,
  findStaffDocumentForScanStatus,
  findStaffDownloadableDocument,
  isDocumentVisibleForCutoff,
  resolveProviderVisibleDocument,
  updateDocumentScanStatus,
} from "../documents.helpers";
import { providerDownloadableDocumentSelect } from "../documents.selects";
import {
  seedProviderDocumentsApplication,
  seedStaffDocumentsApplication,
} from "./documents.fixtures";

const homePlanCreatedAt = new Date("2026-06-15T00:00:00.000Z");

/** Loads a document in the exact shape resolveProviderVisibleDocument expects. */
function readProviderVisibilityDocument(
  documentId: string,
  providerId: string,
) {
  return testPrismaClient.housingApplicationDocument.findUniqueOrThrow({
    where: { id: documentId },
    select: providerDownloadableDocumentSelect(providerId),
  });
}

/** An organization with no claim on the application under test. */
function createOtherHousingProvider() {
  return createHousingProvider(testPrismaClient);
}

describe("scopedProviderId foreign key", () => {
  it("refuses to delete a provider that still has documents scoped to it", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    const housingProvider = await createOtherHousingProvider();
    const unreferenced = await createOtherHousingProvider();
    await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: housingProvider.id,
    });

    // The control: an identical organization with nothing scoped to it deletes
    // cleanly, so the refusal below is this column's foreign key and not some
    // other row hanging off the organization.
    await expect(
      testPrismaClient.housingProvider.delete({
        where: { id: unreferenced.id },
      }),
    ).resolves.toMatchObject({ id: unreferenced.id });

    // Restrict, never SetNull: nulling the column would turn that
    // organization's private documents into documents shared with every
    // provider on the application.
    await expect(
      testPrismaClient.housingProvider.delete({
        where: { id: housingProvider.id },
      }),
    ).rejects.toThrow();
    await expect(
      testPrismaClient.housingProvider.findUnique({
        where: { id: housingProvider.id },
      }),
    ).resolves.not.toBeNull();
  });
});

describe("findStaffDownloadableDocument", () => {
  it("returns a CONFIRMED, CLEAN document owned by the caller", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
    });

    await expect(
      findStaffDownloadableDocument(
        testPrismaClient,
        document.id,
        TEST_STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toEqual({
      applicationId: application.id,
      bucketName: document.bucketName,
      objectKey: document.objectKey,
      fileName: document.fileName,
      documentType: document.documentType,
      scopedProviderId: document.scopedProviderId,
      application: { clientName: application.clientName },
    });
  });

  it("gates on scanStatus CLEAN in addition to CONFIRMED", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    const infected = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
    });
    const unconfirmed = await createHousingApplicationDocument(
      testPrismaClient,
      {
        applicationId: application.id,
        status: HousingApplicationDocumentStatus.PENDING,
        confirmedAt: null,
      },
    );

    await expect(
      findStaffDownloadableDocument(
        testPrismaClient,
        infected.id,
        TEST_STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toBeNull();
    await expect(
      findStaffDownloadableDocument(
        testPrismaClient,
        unconfirmed.id,
        TEST_STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toBeNull();
  });

  it("does not return another staff member's document", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
    });

    await expect(
      findStaffDownloadableDocument(
        testPrismaClient,
        document.id,
        "someone-else",
      ),
    ).resolves.toBeNull();
  });
});

describe("findProviderDownloadableDocument", () => {
  it("returns a shared CONFIRMED, CLEAN document for an active provider", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient);
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
    });

    await expect(
      findProviderDownloadableDocument(
        testPrismaClient,
        document.id,
        housingProvider.id,
      ),
    ).resolves.toMatchObject({
      bucketName: document.bucketName,
      objectKey: document.objectKey,
      fileName: document.fileName,
    });
  });

  it("gates on scanStatus CLEAN in addition to CONFIRMED", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient);
    const infected = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
    });

    await expect(
      findProviderDownloadableDocument(
        testPrismaClient,
        infected.id,
        housingProvider.id,
      ),
    ).resolves.toBeNull();
  });

  it("does not return a document scoped to a different provider", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient);
    const otherHousingProvider = await createOtherHousingProvider();
    const otherHousingProviderDocument = await createHousingApplicationDocument(
      testPrismaClient,
      {
        applicationId: application.id,
        documentType: HousingApplicationDocumentType.ATTACHMENT,
        uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
        uploadedByPseudonymizedId: "other-provider-user",
        scopedProviderId: otherHousingProvider.id,
      },
    );

    await expect(
      findProviderDownloadableDocument(
        testPrismaClient,
        otherHousingProviderDocument.id,
        housingProvider.id,
      ),
    ).resolves.toBeNull();
  });

  it("hides a shared document uploaded after a declined provider's cutoff", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient, {
        providerStage: ApplicationStage.CLOSED,
        closedEvent: {
          eventType: TimelineEventType.PROVIDER_DECLINED,
          createdAt: homePlanCreatedAt,
        },
      });
    const afterCutoff = await createHousingApplicationDocument(
      testPrismaClient,
      {
        applicationId: application.id,
        scopedProviderId: null,
        createdAt: new Date("2026-06-20T00:00:00.000Z"),
      },
    );

    await expect(
      findProviderDownloadableDocument(
        testPrismaClient,
        afterCutoff.id,
        housingProvider.id,
      ),
    ).resolves.toBeNull();
  });
});

describe("findStaffDocumentForScanStatus", () => {
  it("requires CONFIRMED but does not gate on scanStatus CLEAN", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    const infected = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
    });
    const unconfirmed = await createHousingApplicationDocument(
      testPrismaClient,
      {
        applicationId: application.id,
        status: HousingApplicationDocumentStatus.PENDING,
        confirmedAt: null,
        scanStatus: HousingApplicationDocumentScanStatus.PENDING,
      },
    );

    await expect(
      findStaffDocumentForScanStatus(
        testPrismaClient,
        infected.id,
        TEST_STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toEqual({
      id: infected.id,
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
    });
    await expect(
      findStaffDocumentForScanStatus(
        testPrismaClient,
        unconfirmed.id,
        TEST_STAFF_PSEUDONYMIZED_ID,
      ),
    ).resolves.toBeNull();
  });

  it("does not return another staff member's document", async () => {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    const document = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
    });

    await expect(
      findStaffDocumentForScanStatus(
        testPrismaClient,
        document.id,
        "someone-else",
      ),
    ).resolves.toBeNull();
  });
});

describe("findProviderDocumentForScanStatus", () => {
  it("requires provider-visible CONFIRMED docs but does not gate on CLEAN", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient);
    const infected = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
    });

    await expect(
      findProviderDocumentForScanStatus(
        testPrismaClient,
        infected.id,
        housingProvider.id,
      ),
    ).resolves.toMatchObject({
      id: infected.id,
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
    });
  });

  it("does not return a document scoped to a different provider", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient);
    const otherHousingProvider = await createOtherHousingProvider();
    const otherHousingProviderDocument = await createHousingApplicationDocument(
      testPrismaClient,
      {
        applicationId: application.id,
        documentType: HousingApplicationDocumentType.ATTACHMENT,
        uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
        uploadedByPseudonymizedId: "other-provider-user",
        scopedProviderId: otherHousingProvider.id,
        scanStatus: HousingApplicationDocumentScanStatus.PENDING,
      },
    );

    await expect(
      findProviderDocumentForScanStatus(
        testPrismaClient,
        otherHousingProviderDocument.id,
        housingProvider.id,
      ),
    ).resolves.toBeNull();
  });
});

describe("updateDocumentScanStatus", () => {
  const quarantineBucket = "test-quarantine-bucket";
  const cleanBucket = "test-clean-bucket";

  async function seedPendingScanDocument() {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    return createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      bucketName: quarantineBucket,
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
    });
  }

  it("updates a PENDING document to the verdict and records the reported bucket", async () => {
    const document = await seedPendingScanDocument();

    // CLEAN verdicts report the clean bucket the scan job moved the object
    // into, which never matches the quarantine bucketName still stored on
    // the PENDING row — matching must be keyed on objectKey alone.
    const outcome = await updateDocumentScanStatus(
      testPrismaClient,
      { bucketName: cleanBucket, objectKey: document.objectKey },
      HousingApplicationDocumentScanStatus.CLEAN,
    );

    expect(outcome).toBe("updated");
    await expect(
      testPrismaClient.housingApplicationDocument.findUniqueOrThrow({
        where: { id: document.id },
        select: { scanStatus: true, bucketName: true },
      }),
    ).resolves.toEqual({
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      bucketName: cleanBucket,
    });
  });

  it("is a no-op when a duplicate delivery re-applies an already-resolved verdict", async () => {
    const document = await seedPendingScanDocument();
    const ref = { bucketName: cleanBucket, objectKey: document.objectKey };

    await updateDocumentScanStatus(
      testPrismaClient,
      ref,
      HousingApplicationDocumentScanStatus.CLEAN,
    );

    await expect(
      updateDocumentScanStatus(
        testPrismaClient,
        ref,
        HousingApplicationDocumentScanStatus.CLEAN,
      ),
    ).resolves.toBe("already_resolved");
  });

  it("returns not_found for an unrecognized objectKey", async () => {
    await expect(
      updateDocumentScanStatus(
        testPrismaClient,
        {
          bucketName: quarantineBucket,
          objectKey: "applications/unknown/documents/unknown.pdf",
        },
        HousingApplicationDocumentScanStatus.INFECTED,
      ),
    ).resolves.toBe("not_found");
  });
});

describe("isDocumentVisibleForCutoff", () => {
  async function seedDocument(overrides: {
    scopedProviderId: string | null;
    createdAt: Date;
  }) {
    const { application } =
      await seedStaffDocumentsApplication(testPrismaClient);
    return createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      ...overrides,
    });
  }

  it("shows everything when there is no cutoff", async () => {
    const housingProvider = await createOtherHousingProvider();
    const document = await seedDocument({
      scopedProviderId: null,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    });

    expect(isDocumentVisibleForCutoff(document, housingProvider.id, null)).toBe(
      true,
    );
  });

  it("always shows the provider's own-scoped documents", async () => {
    const housingProvider = await createOtherHousingProvider();
    const document = await seedDocument({
      scopedProviderId: housingProvider.id,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    });

    expect(
      isDocumentVisibleForCutoff(
        document,
        housingProvider.id,
        homePlanCreatedAt,
      ),
    ).toBe(true);
  });

  it("shows shared documents uploaded at/before the cutoff", async () => {
    const housingProvider = await createOtherHousingProvider();
    const document = await seedDocument({
      scopedProviderId: null,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });

    expect(
      isDocumentVisibleForCutoff(
        document,
        housingProvider.id,
        homePlanCreatedAt,
      ),
    ).toBe(true);
  });

  it("hides shared documents uploaded after the cutoff", async () => {
    const housingProvider = await createOtherHousingProvider();
    const document = await seedDocument({
      scopedProviderId: null,
      createdAt: new Date("2026-06-20T00:00:00.000Z"),
    });

    expect(
      isDocumentVisibleForCutoff(
        document,
        housingProvider.id,
        homePlanCreatedAt,
      ),
    ).toBe(false);
  });
});

describe("resolveProviderVisibleDocument", () => {
  it("returns the document when the provider can see it", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient);
    const { id } = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    });
    const document = await readProviderVisibilityDocument(
      id,
      housingProvider.id,
    );

    expect(resolveProviderVisibleDocument(document, housingProvider.id)).toBe(
      document,
    );
  });

  it("returns null when the document is missing", () => {
    expect(
      resolveProviderVisibleDocument(null, "housing-provider-1"),
    ).toBeNull();
  });

  it("hides shared docs uploaded after a declined/not-selected provider's cutoff", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient, {
        providerStage: ApplicationStage.CLOSED,
        closedEvent: {
          eventType: TimelineEventType.PROVIDER_NOT_SELECTED,
          createdAt: homePlanCreatedAt,
        },
      });
    const { id } = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
      createdAt: new Date("2026-06-20T00:00:00.000Z"),
    });

    expect(
      resolveProviderVisibleDocument(
        await readProviderVisibilityDocument(id, housingProvider.id),
        housingProvider.id,
      ),
    ).toBeNull();
  });

  it("still shows shared docs uploaded after close to the winning provider", async () => {
    // CLOSED without a closing event of its own: this organization won.
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient, {
        providerStage: ApplicationStage.CLOSED,
      });
    const { id } = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      scopedProviderId: null,
      createdAt: new Date("2026-06-20T00:00:00.000Z"),
    });
    const document = await readProviderVisibilityDocument(
      id,
      housingProvider.id,
    );

    expect(resolveProviderVisibleDocument(document, housingProvider.id)).toBe(
      document,
    );
  });

  it("always allows the provider's own-scoped upload", async () => {
    const { application, housingProvider } =
      await seedProviderDocumentsApplication(testPrismaClient, {
        providerStage: ApplicationStage.CLOSED,
        closedEvent: {
          eventType: TimelineEventType.PROVIDER_NOT_SELECTED,
          createdAt: homePlanCreatedAt,
        },
      });
    const { id } = await createHousingApplicationDocument(testPrismaClient, {
      applicationId: application.id,
      documentType: HousingApplicationDocumentType.ATTACHMENT,
      uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
      uploadedByPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      scopedProviderId: housingProvider.id,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
    });
    const document = await readProviderVisibilityDocument(
      id,
      housingProvider.id,
    );

    expect(resolveProviderVisibleDocument(document, housingProvider.id)).toBe(
      document,
    );
  });
});
