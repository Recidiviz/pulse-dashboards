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

import { renderHook } from "@testing-library/react";

import { useDigitizedDocumentUpload } from "../useDigitizedDocumentUpload";

const testDoubles = vi.hoisted(() => ({
  requestUploadMutate: vi.fn(),
  confirmUploadMutate: vi.fn(),
  getScanStatusForStaffQuery: vi.fn(),
  listForStaffInvalidate: vi.fn(),
  timelineInvalidate: vi.fn(),
  initiateResumableUpload: vi.fn(),
  uploadToGcsWithProgress: vi.fn(),
  pollDocumentScanStatus: vi.fn(),
  addPendingUpload: vi.fn(),
  updatePendingUpload: vi.fn(),
  removePendingUpload: vi.fn(),
}));

vi.mock("../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    addPendingUpload: testDoubles.addPendingUpload,
    updatePendingUpload: testDoubles.updatePendingUpload,
    removePendingUpload: testDoubles.removePendingUpload,
  }),
}));

vi.mock("../../trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      client: {
        documents: {
          requestDigitizedUploadForStaff: {
            mutate: testDoubles.requestUploadMutate,
          },
          confirmUploadForStaff: {
            mutate: testDoubles.confirmUploadMutate,
          },
          getScanStatusForStaff: {
            query: testDoubles.getScanStatusForStaffQuery,
          },
        },
      },
      documents: {
        listForStaff: { invalidate: testDoubles.listForStaffInvalidate },
      },
      timeline: {
        getForStaff: { invalidate: testDoubles.timelineInvalidate },
      },
    }),
  },
}));

vi.mock("../useDocumentUpload", () => ({
  initiateResumableUpload: testDoubles.initiateResumableUpload,
  uploadToGcsWithProgress: testDoubles.uploadToGcsWithProgress,
  pollDocumentScanStatus: testDoubles.pollDocumentScanStatus,
}));

const applicationId = "app-1";
const documentId = "doc-1";

describe("useDigitizedDocumentUpload", () => {
  beforeEach(() => {
    testDoubles.requestUploadMutate
      .mockReset()
      .mockResolvedValue({ documentId, uploadUrl: "https://signed-url" });
    testDoubles.confirmUploadMutate
      .mockReset()
      .mockResolvedValue({ id: documentId });
    testDoubles.getScanStatusForStaffQuery
      .mockReset()
      .mockResolvedValue({ scanStatus: "CLEAN" });
    testDoubles.initiateResumableUpload
      .mockReset()
      .mockResolvedValue("https://session-url");
    testDoubles.uploadToGcsWithProgress
      .mockReset()
      .mockResolvedValue(undefined);
    testDoubles.pollDocumentScanStatus.mockReset().mockResolvedValue(undefined);
    testDoubles.listForStaffInvalidate.mockReset();
    testDoubles.timelineInvalidate.mockReset();
    testDoubles.addPendingUpload.mockReset();
    testDoubles.updatePendingUpload.mockReset();
    testDoubles.removePendingUpload.mockReset();
  });

  it("drives the request -> upload -> confirm -> poll chain for a brand-new digitized document", async () => {
    const { result } = renderHook(() => useDigitizedDocumentUpload());
    const file = new File(["pdf"], "digitized.pdf");

    await result.current.uploadDigitizedDocument(applicationId, file);

    expect(testDoubles.addPendingUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId,
        documentId: "",
        fileName: file.name,
        status: "uploading",
      }),
    );
    const pendingId = testDoubles.addPendingUpload.mock.calls[0][0].pendingId;

    expect(testDoubles.requestUploadMutate).toHaveBeenCalledWith({
      applicationId,
      fileName: file.name,
      mimeType: "application/pdf",
      sizeBytes: file.size,
    });
    expect(testDoubles.updatePendingUpload).toHaveBeenCalledWith(pendingId, {
      documentId,
    });
    expect(testDoubles.initiateResumableUpload).toHaveBeenCalledWith(
      "https://signed-url",
      "application/pdf",
    );
    expect(testDoubles.uploadToGcsWithProgress).toHaveBeenCalledWith(
      "https://session-url",
      file,
      "application/pdf",
      expect.any(Function),
    );
    expect(testDoubles.confirmUploadMutate).toHaveBeenCalledWith({
      documentId,
    });
    expect(testDoubles.updatePendingUpload).toHaveBeenCalledWith(pendingId, {
      status: "scanning",
    });
    expect(testDoubles.pollDocumentScanStatus).toHaveBeenCalledWith(
      expect.any(Function),
      documentId,
      expect.any(Function),
    );
    expect(testDoubles.updatePendingUpload).toHaveBeenCalledWith(
      pendingId,
      expect.objectContaining({ status: "success" }),
    );
    expect(testDoubles.listForStaffInvalidate).toHaveBeenCalledWith({
      applicationId,
    });
    expect(testDoubles.timelineInvalidate).toHaveBeenCalledWith({
      applicationId,
    });
  });

  it("reports upload progress to the shared store as bytes stream to GCS", async () => {
    testDoubles.uploadToGcsWithProgress.mockImplementation(
      async (_url, _file, _contentType, onProgress) => {
        onProgress(50, 100);
      },
    );
    const { result } = renderHook(() => useDigitizedDocumentUpload());
    const file = new File(["pdf"], "digitized.pdf");

    await result.current.uploadDigitizedDocument(applicationId, file);

    const pendingId = testDoubles.addPendingUpload.mock.calls[0][0].pendingId;
    expect(testDoubles.updatePendingUpload).toHaveBeenCalledWith(pendingId, {
      loadedBytes: 50,
      totalBytes: 100,
      progress: 50,
    });
  });

  it("marks the pending upload as failed and does not invalidate anything when confirm fails", async () => {
    testDoubles.confirmUploadMutate.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useDigitizedDocumentUpload());
    const file = new File(["pdf"], "digitized.pdf");

    await expect(
      result.current.uploadDigitizedDocument(applicationId, file),
    ).rejects.toThrow("boom");

    const pendingId = testDoubles.addPendingUpload.mock.calls[0][0].pendingId;
    expect(testDoubles.updatePendingUpload).toHaveBeenCalledWith(
      pendingId,
      expect.objectContaining({ status: "failed" }),
    );
    expect(testDoubles.listForStaffInvalidate).not.toHaveBeenCalled();
  });
});
