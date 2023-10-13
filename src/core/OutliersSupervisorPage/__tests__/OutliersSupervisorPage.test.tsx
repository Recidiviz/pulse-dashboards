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
import { BrowserRouter } from "react-router-dom";

import { useRootStore } from "../../../components/StoreProvider";
import { OutliersConfigFixture } from "../../../OutliersStore/models/offlineFixtures/OutliersConfigFixture";
import { OutliersStore } from "../../../OutliersStore/OutliersStore";
import { SupervisionOfficersPresenter } from "../../../OutliersStore/presenters/SupervisionOfficersPresenter";
import { OutliersSupervisionStore } from "../../../OutliersStore/stores/OutliersSupervisionStore";
import { RootStore } from "../../../RootStore";
import OutliersSupervisorPage, {
  SupervisorPage,
} from "../OutliersSupervisorPage";

jest.mock("../../../components/StoreProvider");

describe("Hydrated Supervisor Page", () => {
  let presenter: SupervisionOfficersPresenter;

  beforeAll(async () => {
    const store = new OutliersSupervisionStore(
      new OutliersStore(new RootStore()),
      OutliersConfigFixture
    );
    presenter = new SupervisionOfficersPresenter(store, "mdavis123");
    await presenter?.hydrate();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  test("Renders the correct title", () => {
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>
    );

    expect(
      screen.getByText(
        "2 of the 3 officers in your unit are outliers on one or more metrics"
      )
    ).toBeInTheDocument();
  });

  test("Renders the info items", () => {
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>
    );

    [
      "D1",
      "Miles D Davis",
      "Duke Ellington, Chet Baker, Louis Armstrong",
    ].forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  test("Renders the info items", () => {
    render(
      <BrowserRouter>
        <SupervisorPage presenter={presenter} />
      </BrowserRouter>
    );

    [
      "D1",
      "Miles D Davis",
      "Duke Ellington, Chet Baker, Louis Armstrong",
    ].forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });
});

describe("Outliers Supervisor Page", () => {
  let store: OutliersSupervisionStore;

  beforeEach(() => {
    jest.resetAllMocks();
    store = new OutliersSupervisionStore(
      new OutliersStore(new RootStore()),
      OutliersConfigFixture
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders loading indicator", () => {
    const presenter = new SupervisionOfficersPresenter(store, "mdavis123");
    presenter.setIsLoading(true);
    render(<OutliersSupervisorPage presenter={presenter} />);

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  test("renders error page", () => {
    (useRootStore as jest.Mock).mockReturnValue({ userStore: {} });

    const presenter = new SupervisionOfficersPresenter(store, "mdavis123");
    presenter.setError(new Error("There was an error"));
    render(<OutliersSupervisorPage presenter={presenter} />);

    expect(
      screen.getByText("Sorry, we’re having trouble loading this page")
    ).toBeInTheDocument();
  });

  test("renders Supervisor Page when hydrated", async () => {
    const presenter = new SupervisionOfficersPresenter(store, "mdavis123");
    await presenter.hydrate();
    render(
      <BrowserRouter>
        <OutliersSupervisorPage presenter={presenter} />
      </BrowserRouter>
    );

    expect(screen.getByText("Miles D Davis")).toBeInTheDocument();
  });
});
