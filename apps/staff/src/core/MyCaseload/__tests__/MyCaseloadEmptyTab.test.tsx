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
import { SupervisionTaskCategory } from "../../WorkflowsTasks/fixtures";
import { MyCaseloadEmptyTab } from "../MyCaseloadEmptyTab";

vi.mock("../../../components/StoreProvider");
const useRootStoreMock = useRootStore as Mock;

function renderEmptyTab(category: SupervisionTaskCategory, selectedCount = 1) {
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      searchStore: {
        selectedSearchables: Array.from({ length: selectedCount }, () => ({})),
      },
    },
  });
  return render(<MyCaseloadEmptyTab category={category} />);
}

describe("MyCaseloadEmptyTab", () => {
  it.each<[SupervisionTaskCategory, string]>([
    [
      "OVERDUE",
      "There are no clients with overdue tasks for the selected caseload.",
    ],
    [
      "DUE_THIS_WEEK",
      "There are no clients with tasks due within the next week for the selected caseload.",
    ],
    [
      "DUE_THIS_MONTH",
      "There are no clients with tasks due within the next month for the selected caseload.",
    ],
    ["ALL_TASKS", "There are no clients for the selected caseload."],
  ])("renders client-oriented copy for %s", (category, expected) => {
    renderEmptyTab(category);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("pluralizes the caseload term when multiple caseloads are selected", () => {
    renderEmptyTab("OVERDUE", 2);
    expect(
      screen.getByText(
        "There are no clients with overdue tasks for the selected caseloads.",
      ),
    ).toBeInTheDocument();
  });

  it("does not render a contact-support link (unlike the Tasks-page empty view)", () => {
    renderEmptyTab("OVERDUE");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
