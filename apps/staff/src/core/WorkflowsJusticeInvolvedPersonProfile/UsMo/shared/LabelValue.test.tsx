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

import { LabelValue } from "./LabelValue";

describe("LabelValue", () => {
  it("renders the label and value", () => {
    render(<LabelValue label="Assessment type">ORAS-CST</LabelValue>);

    expect(screen.getByText("Assessment type")).toBeInTheDocument();
    expect(screen.getByText("ORAS-CST")).toBeInTheDocument();
  });

  it("renders multi-line values", () => {
    render(
      <LabelValue label="Address">
        <div>123 Main St</div>
        <div>Jefferson City, MO</div>
      </LabelValue>,
    );

    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("Jefferson City, MO")).toBeInTheDocument();
  });

  it("forwards className to the container so callers can add outer spacing", () => {
    const { container } = render(
      <LabelValue label="Gender" className="custom-row">
        Male
      </LabelValue>,
    );

    expect(container.querySelector(".custom-row")).toBeInTheDocument();
  });

  it("excludes the value from session recordings via fs-exclude", () => {
    render(<LabelValue label="DOB">01/01/1990</LabelValue>);

    expect(screen.getByText("01/01/1990")).toHaveClass("fs-exclude");
  });
});
