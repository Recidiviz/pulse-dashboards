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
import { Mock } from "vitest";

import { useRootStore } from "../../../components/StoreProvider";
import CaseloadTypeSelect from "../CaseloadTypeSelect";

vi.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as Mock;

// Baseline mock: multi-system tenant with two search types on the home page,
// which is the setup that would normally render pills. Individual tests
// override `isTypesenseSearchEnabled` (and any other fields they care about).
function mockRootStore(overrides: { isTypesenseSearchEnabled: boolean }) {
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      activeSystem: "SUPERVISION",
      workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
      activePage: { page: "home" },
      rootStore: { currentTenantId: "US_MI" },
      systemConfigFor: (system: "SUPERVISION" | "INCARCERATION") =>
        system === "SUPERVISION"
          ? {
              search: [
                { searchType: "OFFICER", searchTitle: "officer" },
                { searchType: "DISTRICT", searchTitle: "district" },
              ],
            }
          : {
              search: [{ searchType: "FACILITY", searchTitle: "facility" }],
            },
      searchStore: {
        searchType: "OFFICER",
        handleSearchPillClick: vi.fn(),
        isTypesenseSearchEnabled: overrides.isTypesenseSearchEnabled,
      },
    },
  });
}

describe("CaseloadTypeSelect", () => {
  it("renders pill buttons when the Typesense search FV is off", () => {
    mockRootStore({ isTypesenseSearchEnabled: false });

    render(<CaseloadTypeSelect />);

    // Sanity check: we get the pills we'd expect from the mock config.
    expect(screen.getByText("Officer")).toBeInTheDocument();
    expect(screen.getByText("District")).toBeInTheDocument();
    expect(screen.getByText("Facility")).toBeInTheDocument();
  });

  it("renders nothing when the Typesense search FV is on", () => {
    mockRootStore({ isTypesenseSearchEnabled: true });

    const { container } = render(<CaseloadTypeSelect />);

    expect(container).toBeEmptyDOMElement();
  });
});
