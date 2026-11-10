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

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApplicationStage,
  HousingApplicationDocumentScanStatus,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";

import { providerUploader } from "../documents.helpers";
import {
  getProviderDocumentScanStatus,
  getStaffDocumentScanStatus,
} from "../documents.service";

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({
  gcsConfig: { bucketName: "test-bucket" },
  resolveGcsReadAccess: vi.fn(),
  deleteGcsObject: vi.fn(),
  generateResumableUploadUrl: vi.fn(),
  gcsObjectExists: vi.fn(),
}));

const documentId = "doc-1";
const homePlanCreatedAt = new Date("2026-06-15T00:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getStaffDocumentScanStatus", () => {
  it("returns PENDING scan status for a visible confirmed document", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: documentId,
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
    });
    const prisma = { housingApplicationDocument: { findFirst } } as never;

    const result = await getStaffDocumentScanStatus(
      prisma,
      TEST_STAFF_PSEUDONYMIZED_ID,
      documentId,
    );

    expect(result).toEqual({
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
        }),
      }),
    );
  });

  it("returns CLEAN when the scan has completed", async () => {
    const prisma = {
      housingApplicationDocument: {
        findFirst: vi.fn().mockResolvedValue({
          id: documentId,
          scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
        }),
      },
    } as never;

    await expect(
      getStaffDocumentScanStatus(
        prisma,
        TEST_STAFF_PSEUDONYMIZED_ID,
        documentId,
      ),
    ).resolves.toEqual({
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
    });
  });

  it("throws NOT_FOUND when the document is not visible to the staff member", async () => {
    const prisma = {
      housingApplicationDocument: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as never;

    await expect(
      getStaffDocumentScanStatus(
        prisma,
        TEST_STAFF_PSEUDONYMIZED_ID,
        documentId,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

const HOUSING_PROVIDER_ID = "housing-provider-1";

describe("getProviderDocumentScanStatus", () => {
  function providerDoc(overrides: Record<string, unknown> = {}) {
    return {
      id: documentId,
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
      scopedProviderId: null,
      application: {
        providerApplications: [
          {
            providerId: HOUSING_PROVIDER_ID,
            stage: ApplicationStage.APPLICATION,
          },
        ],
        timelineEvents: [],
      },
      ...overrides,
    };
  }

  it("returns PENDING scan status for a visible shared document", async () => {
    const prisma = {
      housingApplicationDocument: {
        findFirst: vi.fn().mockResolvedValue(providerDoc()),
      },
    } as never;

    await expect(
      getProviderDocumentScanStatus(
        prisma,
        providerUploader(HOUSING_PROVIDER_ID, TEST_PROVIDER_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).resolves.toEqual({
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
    });
  });

  it("returns INFECTED when the scan has completed with that verdict", async () => {
    const prisma = {
      housingApplicationDocument: {
        findFirst: vi.fn().mockResolvedValue(
          providerDoc({
            scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
          }),
        ),
      },
    } as never;

    await expect(
      getProviderDocumentScanStatus(
        prisma,
        providerUploader(HOUSING_PROVIDER_ID, TEST_PROVIDER_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).resolves.toEqual({
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
    });
  });

  it("blocks a declined/not-selected provider from a shared doc uploaded after their cutoff", async () => {
    const prisma = {
      housingApplicationDocument: {
        findFirst: vi.fn().mockResolvedValue(
          providerDoc({
            createdAt: new Date("2026-06-20T00:00:00.000Z"),
            application: {
              providerApplications: [
                {
                  providerId: HOUSING_PROVIDER_ID,
                  stage: ApplicationStage.CLOSED,
                },
              ],
              timelineEvents: [
                {
                  eventType: TimelineEventType.PROVIDER_NOT_SELECTED,
                  scopedProviderId: HOUSING_PROVIDER_ID,
                  createdAt: homePlanCreatedAt,
                },
              ],
            },
          }),
        ),
      },
    } as never;

    await expect(
      getProviderDocumentScanStatus(
        prisma,
        providerUploader(HOUSING_PROVIDER_ID, TEST_PROVIDER_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws NOT_FOUND when the provider cannot see the document", async () => {
    const prisma = {
      housingApplicationDocument: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as never;

    await expect(
      getProviderDocumentScanStatus(
        prisma,
        providerUploader(HOUSING_PROVIDER_ID, TEST_PROVIDER_PSEUDONYMIZED_ID),
        documentId,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
