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

import { useFeatureVariants } from "../../../../components/StoreProvider";
import { Client } from "../../../../WorkflowsStore";
import { FinesAndFees } from "../FinesAndFees";

vi.mock("../../../../components/StoreProvider");

const client = {
  currentBalance: 125,
  lastPaymentAmount: 40,
  lastPaymentDate: new Date(2026, 8, 15),
} as Client;

describe("FinesAndFees", () => {
  it("shows the balance and last payment by default", () => {
    (useFeatureVariants as Mock).mockReturnValue({});

    render(<FinesAndFees client={client} />);

    expect(screen.getByText("Fines and Fees")).toBeInTheDocument();
    expect(
      screen.getByText("Remaining for current sentence"),
    ).toBeInTheDocument();
    expect(screen.getByText("Last Payment")).toBeInTheDocument();
    expect(
      screen.queryByText("Temporarily unavailable"),
    ).not.toBeInTheDocument();
  });

  it("keeps the section but hides the values when usTnHideFinesAndFees is on", () => {
    (useFeatureVariants as Mock).mockReturnValue({ usTnHideFinesAndFees: {} });

    render(<FinesAndFees client={client} />);

    expect(screen.getByText("Fines and Fees")).toBeInTheDocument();
    expect(screen.getByText("Temporarily unavailable")).toBeInTheDocument();
    expect(
      screen.queryByText("Remaining for current sentence"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Last Payment")).not.toBeInTheDocument();
    expect(screen.queryByText(/\$125/)).not.toBeInTheDocument();
  });
});
