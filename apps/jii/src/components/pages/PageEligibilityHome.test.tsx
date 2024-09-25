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

import { stateConfigsByStateCode } from "../../configs/stateConstants";
import { RootStore } from "../../datastores/RootStore";
import { UserStore } from "../../datastores/UserStore";
import { State } from "../../routes/routes";
import { useResidentsContext } from "../ResidentsLayout/context";
import { PageEligibilityHome } from "./PageEligibilityHome";

vi.mock("../ResidentsLayout/context");

let userStore: UserStore;

function renderPage() {
  render(
    <MemoryRouter
      initialEntries={[
        State.Eligibility.buildPath({
          stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
        }),
      ]}
    >
      <Routes>
        <Route path={State.Eligibility.path}>
          <Route index element={<PageEligibilityHome />} />
          <Route
            path={State.Eligibility.Search.path}
            element={<div>search page</div>}
          />
          {/* in reality this is a parameter, but for now there is only one possible value */}
          <Route
            path={State.Eligibility.Opportunity.path}
            element={<div>SCCP page</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  configure({ safeDescriptors: false });

  const rootStore = new RootStore();
  await flowResult(rootStore.populateResidentsStore());
  vi.mocked(useResidentsContext).mockReturnValue({
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    residentsStore: rootStore.residentsStore!,
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
  vi.spyOn(userStore, "externalId", "get").mockReturnValue("abc123");

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
