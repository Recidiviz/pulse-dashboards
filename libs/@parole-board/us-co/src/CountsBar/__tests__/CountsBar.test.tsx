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
import { axe } from "jest-axe";

import { semantics } from "~@parole-board/common";

import { CountsBar } from "../CountsBar";

describe("CountsBar", () => {
  it("pairs each label with its count in a description list", () => {
    render(<CountsBar entryDays={13} entryCount={37} />);

    const terms = screen.getAllByRole("term");
    expect(terms.map((term) => term.textContent)).toEqual([
      "Hearing days",
      "Hearings",
    ]);
    // Each definition follows its own term inside the same pair.
    expect(terms[0].nextElementSibling).toHaveTextContent(/^13$/);
    expect(terms[1].nextElementSibling).toHaveTextContent(/^37$/);
    expect(screen.getAllByRole("definition")).toHaveLength(2);
  });

  it("shows zero counts for an empty month", () => {
    render(<CountsBar entryDays={0} entryCount={0} />);

    const values = screen.getAllByRole("definition");
    expect(values.map((value) => value.textContent)).toEqual(["0", "0"]);
  });

  it("draws labels in the secondary text colour", () => {
    render(<CountsBar entryDays={13} entryCount={37} />);

    expect(screen.getByText("Hearings")).toHaveStyleRule(
      "color",
      semantics.text.secondary,
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(<CountsBar entryDays={13} entryCount={37} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
