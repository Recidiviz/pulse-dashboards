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

import { fireEvent, render, screen } from "@testing-library/react";
import { Mock } from "vitest";

import { useRootStore } from "../../StoreProvider";
import { Header } from "../Header";

vi.mock("../../StoreProvider");

const mockDownload = vi.fn();
const mockTrackDownloadClicked = vi.fn();
const mockTrackMethodologyLinkClicked = vi.fn();
const mockUseRootStore = useRootStore as Mock;

describe("Header", () => {
  beforeEach(() => {
    mockUseRootStore.mockReturnValue({
      analyticsStore: {
        trackDownloadClicked: mockTrackDownloadClicked,
        trackMethodologyLinkClicked: mockTrackMethodologyLinkClicked,
      },
      metricsStore: {
        current: { id: "prisonPopulationOverTime" },
        download: mockDownload,
      },
    });
  });

  it("calls trackDownloadClicked with the current metric id when Download is clicked", () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("menuitem", { name: "Download" }));

    expect(mockTrackDownloadClicked).toHaveBeenCalledWith({
      metricId: "prisonPopulationOverTime",
    });
  });

  it("calls download when Download is clicked", () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("menuitem", { name: "Download" }));

    expect(mockDownload).toHaveBeenCalled();
  });

  it("calls trackMethodologyLinkClicked when How it works is clicked", () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("menuitem", { name: "How it works" }));

    expect(mockTrackMethodologyLinkClicked).toHaveBeenCalled();
  });
});
