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
import { configure } from "mobx";
import { StaticRouter } from "react-router-dom";

import { useRootStore } from "../../../components/StoreProvider";
import { OutliersConfigFixture } from "../../../OutliersStore/models/offlineFixtures/OutliersConfigFixture";
import { OutliersStore } from "../../../OutliersStore/OutliersStore";
import { OutliersSupervisionStore } from "../../../OutliersStore/stores/OutliersSupervisionStore";
import { RootStore } from "../../../RootStore";
import { outliersUrl } from "../../views";
import { OutliersSupervisionRouter } from "../OutliersSupervisionRouter";

jest.mock(
  "../../../OutliersStore/presenters/SwarmPresenter/getSwarmLayoutWorker"
);
jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;

let outliersStore: OutliersStore;

beforeEach(() => {
  configure({ safeDescriptors: false });
  const rootStore = new RootStore();
  outliersStore = rootStore.outliersStore;

  useRootStoreMock.mockReturnValue(rootStore);
  jest.spyOn(rootStore.userStore, "userAppMetadata", "get").mockReturnValue({
    externalId: "user",
    pseudonymizedId: "hashed-user",
    stateCode: "us_mi",
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  configure({ safeDescriptors: true });
});

function renderRouter(url?: string) {
  render(
    <StaticRouter location={url}>
      <OutliersSupervisionRouter />
    </StaticRouter>
  );
}

test("hydrates", () => {
  jest.spyOn(outliersStore, "hydrateSupervisionStore");

  renderRouter();

  expect(outliersStore.hydrateSupervisionStore).toHaveBeenCalled();
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
  outliersStore.supervisionStore = new OutliersSupervisionStore(
    outliersStore,
    OutliersConfigFixture
  );
  jest
    .spyOn(outliersStore.supervisionStore, "userCanAccessAllSupervisors", "get")
    .mockReturnValue(true);
  renderRouter(outliersUrl("supervisionSupervisorsList"));

  expect(
    await screen.findByText("supervisors across the state have one or more", {
      exact: false,
    })
  ).toBeInTheDocument();
});
