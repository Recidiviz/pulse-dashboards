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

import {
  EnumField,
  LongTextField,
  MultiSelectField,
  TextField,
  YesNoField,
} from "../Fields";

describe("TextField", () => {
  it("shows the value for short text and an em dash for nullish placeholders", () => {
    const { rerender } = render(<TextField label="Name" value="Jane Doe" />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();

    rerender(<TextField label="Name" value="null" />);
    expect(screen.getByText("—")).toBeInTheDocument();

    rerender(<TextField label="Name" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("YesNoField", () => {
  it("renders Yes and No pills and an em dash for missing values", () => {
    const { rerender } = render(
      <YesNoField label="Sex offender registry" value={true} />,
    );
    expect(screen.getByText("Yes")).toBeInTheDocument();

    rerender(<YesNoField label="Sex offender registry" value={false} />);
    expect(screen.getByText("No")).toBeInTheDocument();

    rerender(<YesNoField label="Sex offender registry" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("EnumField", () => {
  it("renders a single neutral pill for a closed-list selection", () => {
    render(<EnumField label="Current status" value="Termer" />);
    expect(screen.getByText("Termer")).toBeInTheDocument();
  });
});

describe("MultiSelectField", () => {
  it("renders one neutral pill per selected value", () => {
    render(
      <MultiSelectField
        label="IDs on file"
        values={["Driver License", "SSN"]}
      />,
    );
    expect(screen.getByText("Driver License")).toBeInTheDocument();
    expect(screen.getByText("SSN")).toBeInTheDocument();
  });

  it("shows an em dash when every value is filtered out", () => {
    render(<MultiSelectField label="IDs on file" values={["null", ""]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("LongTextField", () => {
  it("shows long text beneath the label", () => {
    render(
      <LongTextField
        label="Prescribed medications"
        value="Takes daily insulin"
      />,
    );
    expect(screen.getByText("Prescribed medications")).toBeInTheDocument();
    expect(screen.getByText("Takes daily insulin")).toBeInTheDocument();
  });
});
