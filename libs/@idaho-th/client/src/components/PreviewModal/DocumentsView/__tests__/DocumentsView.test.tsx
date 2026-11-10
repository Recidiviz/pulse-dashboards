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

import { render, screen } from "@testing-library/react";

import {
  createTrpcDouble,
  type TrpcDouble,
} from "../../../../hooks/__tests__/trpcHookDouble";
import { DocumentsView } from "../DocumentsView";

const testDoubles = vi.hoisted(() => ({
  useDocumentsList: vi.fn(),
  useDocumentDownloadUrl: vi.fn(),
  startUpload: vi.fn(),
  cancelUpload: vi.fn(),
  canCancelUpload: vi.fn(),
  startDelete: vi.fn(),
}));

vi.mock("../../../assets/check-circle.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../../assets/dashed-spinner.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../../assets/download.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../../assets/exclamation-circle.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../../assets/single-document.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../../assets/trash-icon.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../../ConfirmationModal/ConfirmationModal", () => ({
  ConfirmationModal: () => null,
}));
vi.mock("../../ClosedBanner", () => ({
  ClosedBanner: () => null,
}));

vi.mock("../../../../hooks/documents", () => ({
  useDocumentsList: testDoubles.useDocumentsList,
  useDocumentDownloadUrl: testDoubles.useDocumentDownloadUrl,
}));

vi.mock("../../../../hooks/useApplicationDetail", () => ({
  useApplicationDetailByRole: () => ({
    clientName: "Jane Doe",
    stage: "PENDING",
  }),
}));

vi.mock("../../../../hooks/useDocumentUpload", () => ({
  useDocumentUpload: () => ({
    startUpload: testDoubles.startUpload,
    cancelUpload: testDoubles.cancelUpload,
    canCancelUpload: testDoubles.canCancelUpload,
    startDelete: testDoubles.startDelete,
  }),
}));

let pendingUploads: Map<string, unknown>;
let trpcTestDouble: TrpcDouble;

const trpcDouble: { current: TrpcDouble | undefined } = vi.hoisted(() => ({
  current: undefined,
}));

vi.mock("../../../../trpc/client", () => ({
  get trpc() {
    return trpcDouble.current?.trpc;
  },
}));

vi.mock("../../../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    currentApplicationId: "app-1",
    pendingUploads,
    removePendingUpload: vi.fn(),
  }),
}));

function makeDocument(id: string, createdAt: Date, fileName: string) {
  return {
    id,
    fileName,
    documentType: "ATTACHMENT",
    contentType: "application/pdf",
    createdAt,
    canDelete: true,
  };
}

describe("DocumentsView", () => {
  beforeEach(() => {
    pendingUploads = new Map();
    trpcTestDouble = createTrpcDouble();
    trpcDouble.current = trpcTestDouble;
    testDoubles.useDocumentDownloadUrl.mockReturnValue(vi.fn());
    testDoubles.canCancelUpload.mockReturnValue(false);
  });

  it("renders documents oldest-to-newest so the most recently uploaded stays at the bottom", () => {
    testDoubles.useDocumentsList.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        // API returns newest-first; component must reverse this for display.
        makeDocument("doc-3", new Date("2026-03-01"), "third.pdf"),
        makeDocument("doc-2", new Date("2026-02-01"), "second.pdf"),
        makeDocument("doc-1", new Date("2026-01-01"), "first.pdf"),
      ],
    });

    render(<DocumentsView variant="staff" />);

    const names = screen.getAllByText(/\.pdf$/).map((el) => el.textContent);
    expect(names).toEqual(["first.pdf", "second.pdf", "third.pdf"]);
  });

  it("shows a loading spinner immediately for a document that is being updated, and hides its download button", () => {
    pendingUploads.set("pending-1", {
      pendingId: "pending-1",
      applicationId: "app-1",
      documentId: "doc-1",
      fileName: "Jane Doe_digitized-application.pdf",
      status: "updating",
      progress: 0,
      loadedBytes: 0,
      totalBytes: 0,
    });
    testDoubles.useDocumentsList.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [makeDocument("doc-1", new Date("2026-01-01"), "digitized.pdf")],
    });

    render(<DocumentsView variant="staff" />);

    expect(screen.getByText("Updating…")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download document" }),
    ).not.toBeInTheDocument();
  });
});
