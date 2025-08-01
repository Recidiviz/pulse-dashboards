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
  mockUnauthorized,
  renderAtRoute,
} from "../../common/components/pages/testUtils";
import { EmailVerification } from "../../routes/routes";

let container: HTMLElement;

beforeEach(() => {
  container = renderAtRoute(EmailVerification.buildPath({})).container;
  mockUnauthorized();
});

it("should render", () => {
  expect(
    screen.getByRole("heading", { name: "Please verify your email" }),
  ).toBeInTheDocument();
});

it("should be accessible", async () => {
  await screen.findByRole("heading", { name: "Please verify your email" });

  expect(await axe(container)).toHaveNoViolations();
});

it("should set the page title", () => {
  expect(document.title).toMatchInlineSnapshot(
    `"Verify your email – Opportunities"`,
  );
});
