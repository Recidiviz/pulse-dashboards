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

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { outputFixture, usMeResidents } from "~datatypes";

import { stateConfigsByStateCode } from "../../configs/stateConstants";
import { State } from "../../routes/routes";
import { PageEligibilityHome } from "./PageEligibilityHome";

const testResident = outputFixture(usMeResidents[0]);

function renderPage() {
  render(
    <MemoryRouter
      initialEntries={[
        State.Resident.Eligibility.buildPath({
          stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
          personPseudoId: testResident.pseudonymizedId,
        }),
      ]}
    >
      <Routes>
        <Route path={State.Resident.Eligibility.path}>
          <Route index element={<PageEligibilityHome />} />
          {/* in reality this is a parameter, but for now there is only one possible value */}
          <Route
            path={State.Resident.Eligibility.$.Opportunity.relativePath}
            element={<div>SCCP page</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

test("redirect to SCCP page", () => {
  renderPage();
  expect(screen.getByText("SCCP page")).toBeInTheDocument();
});
