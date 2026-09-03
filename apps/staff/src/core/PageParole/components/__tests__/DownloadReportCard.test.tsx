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

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";

import { downloadParoleReportZip } from "../../downloadParoleReport";
import {
  DOWNLOAD_REPORT_BUTTON_LABEL,
  DOWNLOAD_REPORT_ERROR_MESSAGE,
  DOWNLOAD_REPORT_GENERATING_LABEL,
  DOWNLOAD_REPORT_SUBTITLE,
  DOWNLOAD_REPORT_TITLE,
  DownloadReportCard,
} from "../DownloadReportCard";
import { PAROLE_REPORT_CAPTURE_ID } from "../shared";

vi.mock("../../downloadParoleReport", () => ({
  downloadParoleReportZip: vi.fn(),
}));
vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn() },
}));

const downloadParoleReportZipMock = vi.mocked(downloadParoleReportZip);
const toastErrorMock = vi.mocked(toast.error);

// The card reads the report content out of the DOM by id, so give it an
// element to find.
function addCaptureElement(): HTMLElement {
  const element = document.createElement("div");
  element.id = PAROLE_REPORT_CAPTURE_ID;
  document.body.appendChild(element);
  return element;
}

beforeEach(() => {
  downloadParoleReportZipMock.mockReset();
  toastErrorMock.mockReset();
  document.getElementById(PAROLE_REPORT_CAPTURE_ID)?.remove();
});

describe("DownloadReportCard", () => {
  it("renders the title, subtitle, and download button", () => {
    render(<DownloadReportCard docId="45821" />);

    expect(screen.getByText(DOWNLOAD_REPORT_TITLE)).toBeInTheDocument();
    expect(screen.getByText(DOWNLOAD_REPORT_SUBTITLE)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: DOWNLOAD_REPORT_BUTTON_LABEL }),
    ).toBeInTheDocument();
  });

  it("generates the report zip from the captured content on click", async () => {
    const captureElement = addCaptureElement();
    const user = userEvent.setup();
    render(<DownloadReportCard docId="45821" />);

    await user.click(
      screen.getByRole("button", { name: DOWNLOAD_REPORT_BUTTON_LABEL }),
    );

    expect(downloadParoleReportZipMock).toHaveBeenCalledWith({
      reportElement: captureElement,
      folderName: "Parole_Report_45821",
    });
  });

  it("disables the button and shows a generating label while the report is generating", async () => {
    addCaptureElement();
    let resolveDownload: () => void = () => undefined;
    downloadParoleReportZipMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveDownload = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<DownloadReportCard docId="45821" />);

    await user.click(
      screen.getByRole("button", { name: DOWNLOAD_REPORT_BUTTON_LABEL }),
    );

    const generatingButton = screen.getByRole("button", {
      name: DOWNLOAD_REPORT_GENERATING_LABEL,
    });
    expect(generatingButton).toBeDisabled();

    resolveDownload();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: DOWNLOAD_REPORT_BUTTON_LABEL }),
      ).toBeEnabled(),
    );
  });

  it("does nothing when the report content is not in the DOM", async () => {
    const user = userEvent.setup();
    render(<DownloadReportCard docId="45821" />);

    await user.click(
      screen.getByRole("button", { name: DOWNLOAD_REPORT_BUTTON_LABEL }),
    );

    expect(downloadParoleReportZipMock).not.toHaveBeenCalled();
  });

  it("shows an error toast and re-enables the button when generation fails", async () => {
    addCaptureElement();
    downloadParoleReportZipMock.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<DownloadReportCard docId="45821" />);

    await user.click(
      screen.getByRole("button", { name: DOWNLOAD_REPORT_BUTTON_LABEL }),
    );

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        DOWNLOAD_REPORT_ERROR_MESSAGE,
      ),
    );
    expect(
      screen.getByRole("button", { name: DOWNLOAD_REPORT_BUTTON_LABEL }),
    ).toBeEnabled();
  });
});
