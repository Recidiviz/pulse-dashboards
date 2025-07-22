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

import { screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";

import { creditDateString } from "~datatypes";

import {
  mockAuthorized,
  renderAtRoute,
} from "../../../../common/components/pages/testUtils";
import { State } from "../../../../routes/routes";

let container: HTMLElement;
let mockAuth: ReturnType<typeof mockAuthorized>;
const reportDateStr = creditDateString({ months: -2 });

beforeEach(() => {
  mockAuth = mockAuthorized({ stateCode: "US_MA" });
  container = renderAtRoute(
    State.Resident.EGT.MonthlyReport.buildPath({
      stateSlug: "mass",
      personPseudoId: mockAuth.personPseudoId,
      // Has to match the dates in the rawUsMaResidentMetadataFixtures.creditActivity
      reportDate: reportDateStr,
    }),
  ).container;
});

it("should render", async () => {
  expect(await screen.findByText("Monthly Report")).toBeInTheDocument();
});

it("should set the page title", async () => {
  const title = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(reportDateStr));

  await waitFor(() =>
    expect(document.title).toBe(`${title} Report – Opportunities`),
  );
});

it("should be accessible", async () => {
  await screen.findByText("Monthly Report");

  expect(await axe(container)).toHaveNoViolations();
});
