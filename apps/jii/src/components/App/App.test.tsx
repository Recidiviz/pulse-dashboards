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

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { App } from "./App";

describe("App", () => {
  it("should render successfully", () => {
    const { baseElement } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(baseElement).toBeInTheDocument();
  });

  it("should render the search page", async () => {
    render(
      <MemoryRouter initialEntries={["/search"]}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText("Select a resident")).toBeInTheDocument(),
    );
  });

  it("should render the sccp page", () => {
    render(
      <MemoryRouter initialEntries={["/eligibility/sccp"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("opportunity page")).toBeInTheDocument();
  });

  it("should render the sccp about page", () => {
    render(
      <MemoryRouter initialEntries={["/eligibility/sccp/about"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("about opportunity")).toBeInTheDocument();
  });

  it("should render the sccp requirements page", () => {
    render(
      <MemoryRouter initialEntries={["/eligibility/sccp/requirements"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("opportunity requirements")).toBeInTheDocument();
  });
});
