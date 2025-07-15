// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { screen } from "@testing-library/react";
import { axe } from "jest-axe";

import {
  mockAuthorized,
  mockUnauthorized,
  renderAtRoute,
} from "../../common/components/pages/testUtils";
import { State } from "../../routes/routes";

let container: HTMLElement;

describe("when logged out", () => {
  beforeEach(() => {
    container = renderAtRoute(
      State.buildPath({ stateSlug: "maine" }),
    ).container;
    mockUnauthorized();
  });

  it("should render", async () => {
    expect(
      await screen.findByRole("button", {
        name: "Staff login",
      }),
    ).toBeInTheDocument();
  });

  it("should be accessible", async () => {
    await screen.findByRole("button", {
      name: "Staff login",
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("should set page title", () => {
    expect(window.document.title).toMatchInlineSnapshot(
      `"Maine – Opportunities"`,
    );
  });
});

describe("when logged in", () => {
  it("should redirect to homepage", async () => {
    mockAuthorized();
    renderAtRoute(State.buildPath({ stateSlug: "maine" }));

    expect(
      await screen.findByRole("heading", {
        name: "Your Progress",
        level: 2,
      }),
    ).toBeInTheDocument();
  });
});
