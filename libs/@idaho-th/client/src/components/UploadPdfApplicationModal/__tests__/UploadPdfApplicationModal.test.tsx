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
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import toast from "react-hot-toast";

import { UploadPdfApplicationModal } from "../UploadPdfApplicationModal";

const testDoubles = vi.hoisted(() => ({
  extractWithVertexAIFromDocument: vi.fn(),
  requestUpload: vi.fn(),
  confirmUpload: vi.fn(),
  cancelUpload: vi.fn(),
  initiateResumableUpload: vi.fn(),
  uploadToGcsWithProgress: vi.fn(),
  pollDocumentScanStatus: vi.fn(),
}));

const APPLICATION_ID = "application-123";
const DOCUMENT_ID = "11111111-1111-1111-1111-111111111111";
const VALID_PDF_CONTENT = "valid pdf content";

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
  },
}));

vi.mock("../../assets/cloud-upload.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../assets/sparkle-duo.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../assets/x.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../assets/exclamation-circle.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock("../Loader", async () => {
  const { useEffect, createElement } = await import("react");
  return {
    Loader: ({
      stages,
      stageIndex,
      isProcessingComplete,
      onBarFilled,
    }: {
      stages: readonly string[];
      stageIndex: number;
      isProcessingComplete: boolean;
      onBarFilled: () => void;
    }) => {
      useEffect(() => {
        if (isProcessingComplete) onBarFilled();
      }, [isProcessingComplete, onBarFilled]);
      return createElement(
        "div",
        null,
        createElement("p", null, stages[stageIndex] ?? ""),
        createElement("p", null, "This will take about 15 seconds total."),
      );
    },
  };
});

vi.mock("../../../trpc/client", () => ({
  trpc: {
    vertex: {
      extractWithVertexAIFromDocument: {
        useMutation: () => ({
          mutateAsync: testDoubles.extractWithVertexAIFromDocument,
        }),
      },
    },
    vertexUpload: {
      requestUpload: {
        useMutation: () => ({ mutateAsync: testDoubles.requestUpload }),
      },
      confirmUpload: {
        useMutation: () => ({ mutateAsync: testDoubles.confirmUpload }),
      },
      cancelUpload: {
        useMutation: () => ({ mutateAsync: testDoubles.cancelUpload }),
      },
    },
    useUtils: () => ({
      client: { vertexUpload: { getScanStatus: { query: vi.fn() } } },
    }),
  },
}));

vi.mock("../../../hooks/useDocumentUpload", () => ({
  DocumentScanError: class DocumentScanError extends Error {},
  initiateResumableUpload: testDoubles.initiateResumableUpload,
  uploadToGcsWithProgress: testDoubles.uploadToGcsWithProgress,
  pollDocumentScanStatus: testDoubles.pollDocumentScanStatus,
}));

function createValidPdf(): File {
  return new File([VALID_PDF_CONTENT], "application.pdf", {
    type: "application/pdf",
  });
}

function dropFile(file: File): void {
  fireEvent.drop(screen.getByRole("button", { name: /choose a file/i }), {
    dataTransfer: { files: [file] },
  });
}

describe("UploadPdfApplicationModal", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
    testDoubles.extractWithVertexAIFromDocument.mockReset();
    testDoubles.requestUpload.mockReset();
    testDoubles.confirmUpload.mockReset();
    testDoubles.cancelUpload.mockReset();
    testDoubles.initiateResumableUpload.mockReset();
    testDoubles.uploadToGcsWithProgress.mockReset();
    testDoubles.pollDocumentScanStatus.mockReset();

    testDoubles.requestUpload.mockResolvedValue({
      applicationId: APPLICATION_ID,
      documentId: DOCUMENT_ID,
      uploadUrl: "https://storage.googleapis.com/upload-url",
    });
    testDoubles.confirmUpload.mockResolvedValue(undefined);
    testDoubles.cancelUpload.mockResolvedValue({ deleted: true });
    testDoubles.initiateResumableUpload.mockResolvedValue(
      "https://storage.googleapis.com/session-url",
    );
    testDoubles.uploadToGcsWithProgress.mockResolvedValue(undefined);
    testDoubles.pollDocumentScanStatus.mockResolvedValue(undefined);
  });

  test("calls onCompletion with extracted application data when a valid PDF is processed successfully", async () => {
    const hideModal = vi.fn();
    const onCompletion = vi.fn();
    const extractedApplication = {
      clientFullName: "John Doe",
      idocNumber: "12345",
    };
    const preparedPdf = {
      signedUrl: "https://example.com/application.pdf",
      sizeInBytes: 1234,
      updatedAt: "2026-06-03T00:00:00.000Z",
    };
    testDoubles.extractWithVertexAIFromDocument.mockResolvedValue({
      applicationId: APPLICATION_ID,
      application: extractedApplication,
      preparedPdf,
    });

    render(
      <UploadPdfApplicationModal
        isOpen
        hideModal={hideModal}
        onCompletion={onCompletion}
      />,
    );

    dropFile(createValidPdf());

    expect(
      await screen.findByText("1. Uploading document"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(testDoubles.requestUpload).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(testDoubles.confirmUpload).toHaveBeenCalledWith({
        documentId: DOCUMENT_ID,
      });
    });

    await waitFor(() => {
      expect(testDoubles.extractWithVertexAIFromDocument).toHaveBeenCalledWith({
        documentId: DOCUMENT_ID,
      });
    });

    await waitFor(() => {
      expect(onCompletion).toHaveBeenCalledWith(
        APPLICATION_ID,
        extractedApplication,
        preparedPdf,
      );
    });
    expect(hideModal).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  test("rejects non-PDF files without calling extraction APIs", () => {
    const onCompletion = vi.fn();

    render(
      <UploadPdfApplicationModal
        isOpen
        hideModal={vi.fn()}
        onCompletion={onCompletion}
      />,
    );

    dropFile(
      new File(["not a pdf"], "application.txt", {
        type: "text/plain",
      }),
    );

    expect(toast.error).toHaveBeenCalledWith("Please upload a PDF file.");
    expect(testDoubles.requestUpload).not.toHaveBeenCalled();
    expect(testDoubles.extractWithVertexAIFromDocument).not.toHaveBeenCalled();
    expect(onCompletion).not.toHaveBeenCalled();
  });

  test("accepts only a single PDF and ignores additional dropped files", async () => {
    testDoubles.extractWithVertexAIFromDocument.mockResolvedValue({
      applicationId: APPLICATION_ID,
      application: { clientFullName: "Jane Doe" },
      preparedPdf: {
        signedUrl: "https://example.com/application.pdf",
        sizeInBytes: 1234,
        updatedAt: "2026-06-03T00:00:00.000Z",
      },
    });

    render(
      <UploadPdfApplicationModal
        isOpen
        hideModal={vi.fn()}
        onCompletion={vi.fn()}
      />,
    );

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput.accept).toContain("application/pdf");
    expect(fileInput.multiple).toBe(false);

    const firstPdf = createValidPdf();
    const secondPdf = new File([VALID_PDF_CONTENT], "second.pdf", {
      type: "application/pdf",
    });

    fireEvent.drop(screen.getByRole("button", { name: /choose a file/i }), {
      dataTransfer: { files: [firstPdf, secondPdf] },
    });

    await waitFor(() => {
      expect(testDoubles.requestUpload).toHaveBeenCalledTimes(1);
    });
    expect(testDoubles.requestUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "application.pdf",
      }),
    );
  });

  test("rejects PDFs larger than 10 MB without calling extraction APIs", () => {
    const onCompletion = vi.fn();
    const oversizedPdf = createValidPdf();
    Object.defineProperty(oversizedPdf, "size", {
      value: 10 * 1024 * 1024 + 1,
    });

    render(
      <UploadPdfApplicationModal
        isOpen
        hideModal={vi.fn()}
        onCompletion={onCompletion}
      />,
    );

    dropFile(oversizedPdf);

    expect(toast.error).toHaveBeenCalledWith("File must be 10 MB or smaller.");
    expect(testDoubles.requestUpload).not.toHaveBeenCalled();
    expect(testDoubles.extractWithVertexAIFromDocument).not.toHaveBeenCalled();
    expect(onCompletion).not.toHaveBeenCalled();
  });

  test("processes the same valid PDF successfully after reopening the modal", async () => {
    const hideModal = vi.fn();
    const onCompletion = vi.fn();
    const file = createValidPdf();
    const extractionResult = {
      applicationId: APPLICATION_ID,
      application: {
        clientFullName: "John Doe",
        idocNumber: "12345",
      },
      preparedPdf: {
        signedUrl: "https://example.com/application.pdf",
      },
    };
    testDoubles.extractWithVertexAIFromDocument.mockResolvedValue(
      extractionResult,
    );

    const processPdf = async (expectedCallCount: number) => {
      const { unmount } = render(
        <UploadPdfApplicationModal
          isOpen
          hideModal={hideModal}
          onCompletion={onCompletion}
        />,
      );
      const input = screen.getByLabelText("PDF application file");

      fireEvent.change(input, {
        target: { files: [file] },
      });

      await waitFor(() => {
        expect(
          testDoubles.extractWithVertexAIFromDocument,
        ).toHaveBeenCalledTimes(expectedCallCount);
      });
      await waitFor(() => {
        expect(onCompletion).toHaveBeenCalledTimes(expectedCallCount);
      });
      unmount();
    };

    await processPdf(1);
    await processPdf(2);

    expect(toast.error).not.toHaveBeenCalled();
    expect(onCompletion).toHaveBeenNthCalledWith(
      1,
      extractionResult.applicationId,
      extractionResult.application,
      extractionResult.preparedPdf,
    );
    expect(onCompletion).toHaveBeenNthCalledWith(
      2,
      extractionResult.applicationId,
      extractionResult.application,
      extractionResult.preparedPdf,
    );
    expect(hideModal).toHaveBeenCalledTimes(2);
    expect(testDoubles.extractWithVertexAIFromDocument).toHaveBeenNthCalledWith(
      1,
      {
        documentId: DOCUMENT_ID,
      },
    );
    expect(testDoubles.extractWithVertexAIFromDocument).toHaveBeenNthCalledWith(
      2,
      {
        documentId: DOCUMENT_ID,
      },
    );
    expect(testDoubles.requestUpload).toHaveBeenNthCalledWith(1, {
      fileName: file.name,
      mimeType: "application/pdf",
      sizeBytes: file.size,
    });
    expect(testDoubles.requestUpload).toHaveBeenNthCalledWith(2, {
      fileName: file.name,
      mimeType: "application/pdf",
      sizeBytes: file.size,
    });
  });

  test("shows the loader while extraction is pending", async () => {
    const hideModal = vi.fn();
    const onCompletion = vi.fn();
    testDoubles.extractWithVertexAIFromDocument.mockImplementation(
      () => new Promise(() => undefined),
    );

    render(
      <UploadPdfApplicationModal
        isOpen
        hideModal={hideModal}
        onCompletion={onCompletion}
      />,
    );

    dropFile(createValidPdf());

    expect(
      await screen.findByText("1. Uploading document"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This will take about 15 seconds total."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /choose a file/i }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(testDoubles.extractWithVertexAIFromDocument).toHaveBeenCalledWith({
        documentId: DOCUMENT_ID,
      });
    });
    expect(onCompletion).not.toHaveBeenCalled();
    expect(hideModal).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  test("shows a processing error modal when extraction fails for a valid PDF", async () => {
    const onCompletion = vi.fn();
    const hideModal = vi.fn();
    let rejectExtraction: (reason?: unknown) => void = () => undefined;
    testDoubles.extractWithVertexAIFromDocument.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectExtraction = reject;
        }),
    );

    render(
      <UploadPdfApplicationModal
        isOpen
        hideModal={hideModal}
        onCompletion={onCompletion}
      />,
    );

    dropFile(createValidPdf());

    expect(
      await screen.findByText("1. Uploading document"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(testDoubles.extractWithVertexAIFromDocument).toHaveBeenCalledWith({
        documentId: DOCUMENT_ID,
      });
    });

    await act(async () => {
      rejectExtraction(new Error("Extraction failed"));
    });

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(testDoubles.cancelUpload).toHaveBeenCalledWith({
      applicationId: APPLICATION_ID,
    });
    expect(toast.error).not.toHaveBeenCalled();
    expect(onCompletion).not.toHaveBeenCalled();
    expect(hideModal).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByText("Upload PDF application"),
    ).toBeInTheDocument();
  });

  test("cancelling the processing error modal closes the upload modal", async () => {
    const hideModal = vi.fn();
    let rejectExtraction: (reason?: unknown) => void = () => undefined;
    testDoubles.extractWithVertexAIFromDocument.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectExtraction = reject;
        }),
    );

    render(<UploadPdfApplicationModal isOpen hideModal={hideModal} />);

    dropFile(createValidPdf());

    await waitFor(() => {
      expect(testDoubles.extractWithVertexAIFromDocument).toHaveBeenCalledWith({
        documentId: DOCUMENT_ID,
      });
    });

    await act(async () => {
      rejectExtraction(new Error("Extraction failed"));
    });

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(hideModal).toHaveBeenCalled();
  });
});
