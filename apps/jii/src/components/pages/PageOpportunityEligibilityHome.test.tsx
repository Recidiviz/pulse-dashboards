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
  renderAtRoute,
} from "../../common/components/pages/testUtils";
import { usMeProgressModuleConfig } from "../../configs/US_ME/progress/config";
import { State } from "../../routes/routes";

let container: HTMLElement;

beforeEach(() => {
  const mockAuth = mockAuthorized();
  container = renderAtRoute(
    State.Resident.Progress.InfoPage.buildPath({
      stateSlug: "maine",
      personPseudoId: mockAuth.personPseudoId,
      pageSlug: usMeProgressModuleConfig.progressPage.urlSlug,
    }),
  ).container;
});

it("should render", async () => {
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: usMeProgressModuleConfig.progressPage.heading,
    }),
  ).toBeInTheDocument();
});

it("should be accessible", async () => {
  await screen.findByRole("heading", {
    level: 1,
    name: usMeProgressModuleConfig.progressPage.heading,
  });

  expect(await axe(container)).toHaveNoViolations();
});

it("should set the page title", () => {
  expect(window.document.title).toBe(
    `${usMeProgressModuleConfig.progressPage.heading} – Opportunities`,
  );
});
