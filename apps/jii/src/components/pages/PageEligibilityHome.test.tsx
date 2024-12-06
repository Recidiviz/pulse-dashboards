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
import { configure, flowResult } from "mobx";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MockedFunction } from "vitest";

import { outputFixture, usMeResidents } from "~datatypes";

import { stateConfigsByStateCode } from "../../configs/stateConstants";
import { RootStore } from "../../datastores/RootStore";
import { UserStore } from "../../datastores/UserStore";
import { State } from "../../routes/routes";
import {
  ResidentsContext,
  useResidentsContext,
} from "../ResidentsHydrator/context";
import { PageEligibilityHome } from "./PageEligibilityHome";

vi.mock("../ResidentsHydrator/context");

let rootStore: RootStore;
let userStore: UserStore;
let residentsContextSpy: MockedFunction<() => ResidentsContext>;

function renderPage() {
  render(
    <MemoryRouter
      initialEntries={[
        State.Resident.Eligibility.buildPath({
          stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
        }),
      ]}
    >
      <Routes>
        <Route path={State.Search.path} element={<div>search page</div>} />
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

beforeEach(async () => {
  configure({ safeDescriptors: false });

  rootStore = new RootStore();
  await flowResult(rootStore.populateResidentsStore());
  residentsContextSpy = vi.mocked(useResidentsContext).mockReturnValue({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    residentsStore: rootStore.residentsStore!,
    activeResident: undefined,
  });

  userStore = rootStore.userStore;
  vi.spyOn(userStore.authClient, "appMetadata", "get").mockReturnValue({
    stateCode: "US_ME",
  });
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

test("SCCP page", () => {
  const testResident = outputFixture(usMeResidents[0]);

  residentsContextSpy.mockReturnValue({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    residentsStore: rootStore.residentsStore!,
    activeResident: testResident,
  });

  renderPage();

  expect(screen.getByText("SCCP page")).toBeInTheDocument();
});

test("search page", () => {
  vi.spyOn(userStore, "hasPermission").mockReturnValue(true);

  renderPage();

  expect(screen.getByText("search page")).toBeInTheDocument();
});

test("error", () => {
  renderPage();

  expect(screen.getByText("Something went wrong")).toBeInTheDocument();
});
