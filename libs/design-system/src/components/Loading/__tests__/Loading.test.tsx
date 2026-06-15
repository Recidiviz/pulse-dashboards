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

import { Loading } from "../Loading";

describe("Loading", () => {
  it("renders the default loading message", () => {
    render(<Loading />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("renders a custom message when provided", () => {
    render(<Loading message="Crunching numbers" />);
    expect(screen.getByText("Crunching numbers")).toBeInTheDocument();
  });

  it("hides the message when showMessage is false", () => {
    render(<Loading showMessage={false} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Loading data...")).not.toBeInTheDocument();
  });

  it("still hides a custom message when showMessage is false", () => {
    render(<Loading message="Should not show" showMessage={false} />);
    expect(screen.queryByText("Should not show")).not.toBeInTheDocument();
  });
});
