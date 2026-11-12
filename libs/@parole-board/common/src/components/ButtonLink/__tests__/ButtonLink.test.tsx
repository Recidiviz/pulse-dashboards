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

import { ButtonLink } from "../ButtonLink";

describe("ButtonLink", () => {
  it("is a link to its href, with its text as the name", () => {
    render(
      <ButtonLink href="https://example.com/2026-09">
        View public page
      </ButtonLink>,
    );

    expect(
      screen.getByRole("link", { name: "View public page" }),
    ).toHaveAttribute("href", "https://example.com/2026-09");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ButtonLink href="https://example.com/2026-09">
        View public page
      </ButtonLink>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
