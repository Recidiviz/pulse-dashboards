// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { StaticRouter } from "react-router-dom";

import StoreProvider from "../../../components/StoreProvider";
import { OutliersStore } from "../../../OutliersStore/OutliersStore";
import { outliersUrl } from "../../views";
import { OutliersSupervisionRouter } from "../OutliersSupervisionRouter";

jest.mock(
  "../../../OutliersStore/presenters/SwarmPresenter/getSwarmLayoutWorker"
);

function renderRouter(url?: string) {
  render(
    <StoreProvider>
      <StaticRouter location={url}>
        <OutliersSupervisionRouter />
      </StaticRouter>
    </StoreProvider>
  );
}

test("hydrates", () => {
  jest.spyOn(OutliersStore.prototype, "hydrateSupervisionStore");

  renderRouter();

  expect(OutliersStore.prototype.hydrateSupervisionStore).toHaveBeenCalled();
});

test("invalid route", async () => {
  renderRouter("/insights/supervision/invalid-path-to-nowhere");

  expect(
    await screen.findByText("Page Not Found", {
      exact: false,
    })
  ).toBeInTheDocument();
});

test("valid route", async () => {
  renderRouter(outliersUrl("supervisionSupervisorsList"));

  expect(
    await screen.findByText("supervisors across the state have one or more", {
      exact: false,
    })
  ).toBeInTheDocument();
});
