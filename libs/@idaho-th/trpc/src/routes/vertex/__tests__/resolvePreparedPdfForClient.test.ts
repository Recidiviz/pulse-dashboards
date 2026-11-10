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

import { HousingApplicationDocumentScanStatus } from "~@idaho-th/prisma/client";
import type { PreparedPdfGcsUploadResult } from "~@idaho-th/trpc/routes/vertex/vertex.types";

const draftIntakeMocks = vi.hoisted(() => ({
  getDocumentScanState: vi.fn(),
}));

const gcsMocks = vi.hoisted(() => ({
  generateSignedReadUrl: vi.fn(),
  signingFailureTrpcError: vi.fn((error: unknown) => error),
}));

vi.mock("~@idaho-th/trpc/routes/draftIntake/draftIntake.service", () => ({
  createDraftIntakeApplication: vi.fn(),
  createDraftIntakeApplicationShell: vi.fn(),
  deleteDraftIntakeApplicationShell: vi.fn(),
  finalizeDraftIntakeApplicationData: vi.fn(),
  getDocumentScanState: draftIntakeMocks.getDocumentScanState,
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({
  deleteGcsObject: vi.fn(),
  generateSignedReadUrl: gcsMocks.generateSignedReadUrl,
  signingFailureTrpcError: gcsMocks.signingFailureTrpcError,
}));

const { resolvePreparedPdfForClient } = await import(
  "~@idaho-th/trpc/routes/vertex/vertex.housing.extractor"
);

const preparedPdf: PreparedPdfGcsUploadResult = {
  objectKey: "applications/app-1/documents/doc-1.pdf",
  bucketName: "quarantine-bucket",
  contentType: "application/pdf",
  fileName: "doc-1.pdf",
  sizeInBytes: 1024,
  updatedAt: "2026-07-08T00:00:00.000Z",
  signedUrl: "https://quarantine-signed-url",
};

const deps = {
  prisma: {} as never,
  extractor: {} as never,
  log: { info: vi.fn(), error: vi.fn() },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolvePreparedPdfForClient", () => {
  it("returns a signed URL when the scan status is CLEAN", async () => {
    draftIntakeMocks.getDocumentScanState.mockResolvedValue({
      scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
      bucketName: "clean-bucket",
    });
    gcsMocks.generateSignedReadUrl.mockResolvedValue("https://signed-url");

    const result = await resolvePreparedPdfForClient(preparedPdf, deps);

    expect(result).toEqual({
      preparedPdf: {
        signedUrl: "https://signed-url",
        sizeInBytes: preparedPdf.sizeInBytes,
        updatedAt: preparedPdf.updatedAt,
      },
      preparedPdfPending: false,
    });
    expect(gcsMocks.generateSignedReadUrl).toHaveBeenCalledWith(
      expect.objectContaining({ bucketName: "clean-bucket" }),
    );
  });

  it("reports pending and never signs a URL when the scan status is PENDING", async () => {
    draftIntakeMocks.getDocumentScanState.mockResolvedValue({
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
      bucketName: "quarantine-bucket",
    });

    const result = await resolvePreparedPdfForClient(preparedPdf, deps);

    expect(result).toEqual({ preparedPdfPending: true });
    expect(gcsMocks.generateSignedReadUrl).not.toHaveBeenCalled();
  });

  it("reports pending and never signs a URL when the scan status is INFECTED", async () => {
    draftIntakeMocks.getDocumentScanState.mockResolvedValue({
      scanStatus: HousingApplicationDocumentScanStatus.INFECTED,
      bucketName: "quarantine-bucket",
    });

    const result = await resolvePreparedPdfForClient(preparedPdf, deps);

    expect(result).toEqual({ preparedPdfPending: true });
    expect(gcsMocks.generateSignedReadUrl).not.toHaveBeenCalled();
  });

  it("reports pending and never signs a URL when the scan status is FAILED", async () => {
    draftIntakeMocks.getDocumentScanState.mockResolvedValue({
      scanStatus: HousingApplicationDocumentScanStatus.FAILED,
      bucketName: "quarantine-bucket",
    });

    const result = await resolvePreparedPdfForClient(preparedPdf, deps);

    expect(result).toEqual({ preparedPdfPending: true });
    expect(gcsMocks.generateSignedReadUrl).not.toHaveBeenCalled();
  });

  it("reports pending when there is no scan-tracking row at all", async () => {
    draftIntakeMocks.getDocumentScanState.mockResolvedValue(null);

    const result = await resolvePreparedPdfForClient(preparedPdf, deps);

    expect(result).toEqual({ preparedPdfPending: true });
    expect(gcsMocks.generateSignedReadUrl).not.toHaveBeenCalled();
  });
});
