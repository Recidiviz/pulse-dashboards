// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { parseISO } from "date-fns";
import { Mock } from "vitest";

import { useRootStore } from "../../../components/StoreProvider";
import { Resident } from "../../../WorkflowsStore/Resident";
import { IncarcerationProgress } from "../SentenceProgress";

vi.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as Mock;

describe("IncarcerationProgress", () => {
  it("renders with default relase copy without a tenant override", () => {
    const mockResident = {
      admissionDate: parseISO("2024-01-01"),
      releaseDate: parseISO("2024-12-31"),
      onLifeSentence: false,
    } as Resident;

    useRootStoreMock.mockReturnValue({
      tenantStore: { releaseDateCopy: "Some Custom Copy" },
    });

    render(<IncarcerationProgress resident={mockResident} />);

    const relaseDateText = screen.queryByText("Some Custom Copy", {
      exact: false,
    });
    expect(relaseDateText).toBeInTheDocument();

    // Make sure default copy is not appearing
    const defaultText = screen.queryByText("Release", { exact: false });
    expect(defaultText).not.toBeInTheDocument();
  });
});
