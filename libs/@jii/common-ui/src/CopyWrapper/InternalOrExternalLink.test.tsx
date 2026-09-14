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

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { InternalOrExternalLink } from "./InternalOrExternalLink";

function renderLink(href: string) {
  render(
    <MemoryRouter>
      <InternalOrExternalLink href={href}>link text</InternalOrExternalLink>
    </MemoryRouter>,
  );
}

test.each([
  "https://example.com/",
  "//example.com/",
  "mailto:test@example.com",
  "tel:+15555550123",
])("renders %s as an external link", (href) => {
  renderLink(href);

  expect(screen.getByRole("link", { name: "link text" })).toHaveAttribute(
    "href",
    href,
  );
});

test("navigates a local path through the router", async () => {
  render(
    <MemoryRouter initialEntries={["/start"]}>
      <Routes>
        <Route
          path="/start"
          element={
            <InternalOrExternalLink href="/destination">
              link text
            </InternalOrExternalLink>
          }
        />
        <Route path="/destination" element={<p>destination page</p>} />
      </Routes>
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("link", { name: "link text" }));

  expect(await screen.findByText("destination page")).toBeInTheDocument();
});

// these can execute script when clicked, so they must not be rendered as links at all.
test.each([
  // eslint-disable-next-line no-script-url
  "javascript:alert(1)",
  // eslint-disable-next-line no-script-url
  "JaVaScRiPt:alert(1)",
  "data:text/html,<script>alert(1)</script>",
])("does not render %s as a link", (href) => {
  renderLink(href);

  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  // the text is still shown, just not linked
  expect(screen.getByText("link text")).toBeInTheDocument();
});
