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
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { Link } from "../Link";

function StateProbe() {
  const location = useLocation();
  const state = location.state as { previousPage?: string } | null;
  return (
    <div data-testid="state">{state ? JSON.stringify(state) : "null"}</div>
  );
}

function renderLink(ui: ReactNode, initialEntry = "/current?tenantId=US_MO") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/current" element={ui} />
        <Route path="*" element={<StateProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

const href = () => screen.getByRole("link").getAttribute("href");

describe("Link tenantId handling", () => {
  it("appends the current tenantId to a bare path", () => {
    renderLink(<Link to="/dest">go</Link>);
    expect(href()).toBe("/dest?tenantId=US_MO");
  });

  it("appends tenantId alongside an existing query and preserves the hash", () => {
    renderLink(<Link to="/dest?foo=1#sec">go</Link>);
    expect(href()).toBe("/dest?foo=1&tenantId=US_MO#sec");
  });

  it("respects an explicit tenantId in `to` (override)", () => {
    renderLink(<Link to="/dest?tenantId=US_TN">go</Link>);
    expect(href()).toBe("/dest?tenantId=US_TN");
  });

  it("handles the object `to` form", () => {
    renderLink(<Link to={{ pathname: "/dest", search: "?foo=1" }}>go</Link>);
    expect(href()).toBe("/dest?foo=1&tenantId=US_MO");
  });

  it("leaves `to` unchanged when the current URL has no tenantId", () => {
    renderLink(<Link to="/dest">go</Link>, "/current");
    expect(href()).toBe("/dest");
  });
});

describe("Link previousPage state", () => {
  it("defaults state to { previousPage: <current URL> }", async () => {
    const user = userEvent.setup();
    renderLink(<Link to="/dest">go</Link>, "/current?tenantId=US_MO");
    await user.click(screen.getByRole("link"));
    expect(screen.getByTestId("state")).toHaveTextContent(
      '{"previousPage":"/current?tenantId=US_MO"}',
    );
  });

  it("uses a passed `state` instead of the default", async () => {
    const user = userEvent.setup();
    renderLink(
      <Link to="/dest" state={{ custom: 1 }}>
        go
      </Link>,
    );
    await user.click(screen.getByRole("link"));
    expect(screen.getByTestId("state")).toHaveTextContent('{"custom":1}');
  });

  it("clears state when passed state={null}", async () => {
    const user = userEvent.setup();
    renderLink(
      <Link to="/dest" state={null}>
        go
      </Link>,
    );
    await user.click(screen.getByRole("link"));
    expect(screen.getByTestId("state")).toHaveTextContent("null");
  });
});
