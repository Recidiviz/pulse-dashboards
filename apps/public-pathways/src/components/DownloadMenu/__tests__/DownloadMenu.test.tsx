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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { format } from "date-fns";
import { axe } from "jest-axe";
import ReactModal from "react-modal";
import { ThemeProvider } from "styled-components";
import { Mock } from "vitest";

import { defaultPathwaysTheme } from "~shared-pathways";

import { useRootStore } from "../../StoreProvider";
import { DownloadMenu } from "../DownloadMenu";

vi.mock("../../StoreProvider");

const mockDownload = vi.fn();
const mockDownloadIndividualLevelData = vi.fn();
const mockTrackDownloadClicked = vi.fn();
const mockUseRootStore = useRootStore as Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={defaultPathwaysTheme}>{children}</ThemeProvider>
);

beforeAll(() => {
  ReactModal.setAppElement(document.createElement("div"));
});

describe("DownloadMenu", () => {
  beforeEach(() => {
    mockDownloadIndividualLevelData.mockResolvedValue(undefined);
    mockUseRootStore.mockReturnValue({
      analyticsStore: { trackDownloadClicked: mockTrackDownloadClicked },
      metricsStore: {
        current: { id: "prisonPopulationOverTime" },
        download: mockDownload,
        downloadIndividualLevelData: mockDownloadIndividualLevelData,
      },
    });
  });

  const openMenu = () => {
    fireEvent.click(screen.getByRole("button", { name: /Download/i }));
  };

  const openIndividualLevelDataFlow = () => {
    openMenu();
    fireEvent.click(screen.getByText("Individual-level data"));
  };

  // Advances from the choose-snapshot step to the terms-of-use step by
  // picking the bulk option, since it requires no further input.
  const continueWithBulkOption = () => {
    fireEvent.click(screen.getByText("Every month, last 5 years"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  };

  // Selects the single-snapshot option (revealing its calendar) and clicks
  // today's month -- valid regardless of the current date, since "today" is
  // always within the picker's [minDate, maxDate] range.
  const pickCurrentMonth = () => {
    fireEvent.click(screen.getByText("A single month's snapshot"));
    fireEvent.click(screen.getByText(format(new Date(), "MMM")));
  };

  it("downloads chart data and tracks it when the Chart data option is clicked", () => {
    render(<DownloadMenu />, { wrapper });

    openMenu();
    fireEvent.click(screen.getByText("Chart data"));

    expect(mockDownload).toHaveBeenCalled();
    expect(mockTrackDownloadClicked).toHaveBeenCalledWith({
      metricId: "prisonPopulationOverTime",
      downloadType: "chart_data",
    });
  });

  it("opens the choose-snapshot modal when the Individual-level data option is clicked", () => {
    render(<DownloadMenu />, { wrapper });

    openIndividualLevelDataFlow();

    expect(
      screen.getByRole("heading", { name: "Individual-level data" }),
    ).toBeInTheDocument();
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it("disables Continue until a snapshot option is chosen", () => {
    render(<DownloadMenu />, { wrapper });

    openIndividualLevelDataFlow();

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByText("Every month, last 5 years"));
    expect(continueButton).toBeEnabled();
  });

  it("shows the month/year picker once the single-snapshot option is chosen, and keeps Continue disabled until a date is picked", () => {
    render(<DownloadMenu />, { wrapper });

    openIndividualLevelDataFlow();

    expect(
      screen.queryByRole("button", { name: "Previous year" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("A single month's snapshot"));

    expect(
      screen.getByRole("button", { name: "Previous year" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    fireEvent.click(screen.getByText(format(new Date(), "MMM")));

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("advances to the terms of use step on Continue, and shows a snapshot banner when a specific month/year was chosen", () => {
    render(<DownloadMenu />, { wrapper });

    openIndividualLevelDataFlow();
    pickCurrentMonth();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    const expectedBannerText = `${format(new Date(), "MMMM yyyy")} snapshot — complete and unfiltered.`;
    expect(
      screen.getByRole("heading", { name: "Terms of use" }),
    ).toBeInTheDocument();
    expect(screen.getByText(expectedBannerText)).toBeInTheDocument();
  });

  it("does not show a snapshot banner on the terms step when the bulk option was chosen", () => {
    render(<DownloadMenu />, { wrapper });

    openIndividualLevelDataFlow();
    continueWithBulkOption();

    expect(
      screen.getByRole("heading", { name: "Terms of use" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/snapshot — complete/)).not.toBeInTheDocument();
  });

  it("disables Agree & download until the checkbox is checked, then tracks the download on click", async () => {
    render(<DownloadMenu />, { wrapper });

    openIndividualLevelDataFlow();
    continueWithBulkOption();

    const agreeButton = screen.getByRole("button", {
      name: "Agree & download",
    });
    expect(agreeButton).toBeDisabled();

    fireEvent.click(
      screen.getByText(
        "I have read and agree to the terms of use for individual-level data.",
      ),
    );
    expect(agreeButton).toBeEnabled();

    fireEvent.click(agreeButton);

    expect(mockDownloadIndividualLevelData).toHaveBeenCalled();
    expect(mockTrackDownloadClicked).toHaveBeenCalledWith({
      metricId: "prisonPopulationOverTime",
      downloadType: "individual_level_data",
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Terms of use" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("returns to the choose-snapshot step without losing the selection when Back is clicked", () => {
    render(<DownloadMenu />, { wrapper });

    openIndividualLevelDataFlow();
    pickCurrentMonth();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Terms of use" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(
      screen.getByRole("heading", { name: "Individual-level data" }),
    ).toBeInTheDocument();
    // Continue is still enabled without re-picking a date, proving the
    // previously picked month/year survived the trip back.
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("requires re-checking the agreement box after going back and continuing again", () => {
    render(<DownloadMenu />, { wrapper });

    openIndividualLevelDataFlow();
    continueWithBulkOption();
    fireEvent.click(
      screen.getByText(
        "I have read and agree to the terms of use for individual-level data.",
      ),
    );
    expect(
      screen.getByRole("button", { name: "Agree & download" }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    continueWithBulkOption();

    expect(
      screen.getByRole("button", { name: "Agree & download" }),
    ).toBeDisabled();
  });

  it("resets the wizard to the first step when cancelled from the choose-snapshot step and reopened", async () => {
    render(<DownloadMenu />, { wrapper });

    openIndividualLevelDataFlow();
    pickCurrentMonth();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Individual-level data" }),
      ).not.toBeInTheDocument(),
    );
    expect(mockTrackDownloadClicked).not.toHaveBeenCalled();

    openIndividualLevelDataFlow();

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("has no axe violations when closed", async () => {
    const { container } = render(<DownloadMenu />, { wrapper });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations with the dropdown open", async () => {
    const { container } = render(<DownloadMenu />, { wrapper });
    openMenu();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations with the choose-snapshot modal open", async () => {
    // Wrapped in a real <header> landmark, since that's how DownloadMenu is
    // always rendered in the app (Header.tsx's HeaderWrapper is a <header>) --
    // rendering it bare would make axe flag the dropdown panel as landmark-less,
    // which isn't true of the real page.
    render(<header>{<DownloadMenu />}</header>, { wrapper });
    openIndividualLevelDataFlow();
    // The modal renders in a portal outside `container`, so check `document.body`.
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("has no axe violations with the terms of use modal open", async () => {
    render(<header>{<DownloadMenu />}</header>, { wrapper });
    openIndividualLevelDataFlow();
    continueWithBulkOption();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
