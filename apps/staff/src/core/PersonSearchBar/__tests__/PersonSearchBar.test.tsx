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

import { useRootStore } from "../../../components/StoreProvider";
import { PersonSearchResult } from "../../../WorkflowsStore/types";
import { PersonSearchBar } from "../PersonSearchBar";

const navigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => navigate,
}));

vi.mock("../../../components/StoreProvider");
const useRootStoreMock = useRootStore as Mock;

const clientResult: PersonSearchResult = {
  personType: "CLIENT",
  personExternalId: "EXT1",
  pseudonymizedId: "p1",
  givenNames: "Jane",
  surname: "Doe",
};

const residentResult: PersonSearchResult = {
  personType: "RESIDENT",
  personExternalId: "EXT2",
  pseudonymizedId: "p2",
  givenNames: "John",
  surname: "Doe",
};

const trackPersonSearchResultClicked = vi.fn();
const handleSearchInput = vi.fn();

function renderPersonSearchBar() {
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      searchStore: {
        personSearchManager: {
          searchPending: false,
          results: [clientResult, residentResult],
          handleSearchInput,
        },
      },
    },
    analyticsStore: { trackPersonSearchResultClicked },
  });

  return render(<PersonSearchBar />);
}

beforeEach(() => {
  navigate.mockClear();
  trackPersonSearchResultClicked.mockClear();
  handleSearchInput.mockClear();
});

describe("PersonSearchBar", () => {
  it("opens the dropdown with results once the user types", () => {
    renderPersonSearchBar();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Doe" },
    });

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("navigates to the client profile, tracks it, and resets the search on click", () => {
    renderPersonSearchBar();

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Doe" } });
    fireEvent.click(screen.getByText("Jane Doe"));

    expect(navigate).toHaveBeenCalledWith("/workflows/clients/p1");
    expect(trackPersonSearchResultClicked).toHaveBeenCalledWith({
      justiceInvolvedPersonId: "p1",
      personType: "CLIENT",
      searchInput: "Doe",
    });
    expect(input).toHaveValue("");
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("navigates to the resident profile and tracks it on click", () => {
    renderPersonSearchBar();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Doe" },
    });
    fireEvent.click(screen.getByText("John Doe"));

    expect(navigate).toHaveBeenCalledWith("/workflows/residents/p2");
    expect(trackPersonSearchResultClicked).toHaveBeenCalledWith({
      justiceInvolvedPersonId: "p2",
      personType: "RESIDENT",
      searchInput: "Doe",
    });
  });

  it("selects the highlighted result via arrow keys + enter, same as a click", () => {
    renderPersonSearchBar();

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "o" } });
    // first option (Jane Doe) is focused by default; move down to the second
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(navigate).toHaveBeenCalledWith("/workflows/residents/p2");
    expect(trackPersonSearchResultClicked).toHaveBeenCalledWith({
      justiceInvolvedPersonId: "p2",
      personType: "RESIDENT",
      searchInput: "o",
    });
    expect(input).toHaveValue("");
  });
});
