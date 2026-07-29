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
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ParoleCaseProfile } from "../ParoleCaseProfile";

function renderAtPath(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/parole/case/:docId" element={<ParoleCaseProfile />} />
        <Route path="*" element={<ParoleCaseProfile />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ParoleCaseProfile", () => {
  it("renders a link back to the docket", () => {
    renderAtPath("/parole/case/DOC-45821");

    const link = screen.getByRole("link", { name: /back to docket/i });
    expect(link).toHaveAttribute("href", "/parole/docket");
  });

  it("renders NotFound when there is no docId in the route", () => {
    renderAtPath("/parole/case-missing-param");

    expect(screen.getByText("Oops Page Not Found")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /back to docket/i }),
    ).not.toBeInTheDocument();
  });
});
