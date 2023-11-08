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
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import { OutliersConfigFixture } from "../../../OutliersStore/models/offlineFixtures/OutliersConfigFixture";
import { supervisionOfficerFixture } from "../../../OutliersStore/models/offlineFixtures/SupervisionOfficerFixture";
import { SupervisionOfficerDetailPresenter } from "../../../OutliersStore/presenters/SupervisionOfficerDetailPresenter";
import { OutliersSupervisionStore } from "../../../OutliersStore/stores/OutliersSupervisionStore";
import { RootStore } from "../../../RootStore";
import AnalyticsStore from "../../../RootStore/AnalyticsStore";
import UserStore from "../../../RootStore/UserStore";
import { StaffPageWithPresenter } from "../OutliersStaffPage";

jest.mock(
  "../../../OutliersStore/presenters/SwarmPresenter/getSwarmLayoutWorker"
);

afterEach(() => {
  jest.resetAllMocks();
});

describe("Hydrated Staff Page", () => {
  let presenter: SupervisionOfficerDetailPresenter;
  let store: OutliersSupervisionStore;
  const supervisorPseudoId = "hashed-mdavis123";
  const officerPseudoId = supervisionOfficerFixture[0].pseudonymizedId;

  beforeAll(async () => {
    jest
      .spyOn(UserStore.prototype, "userPseudoId", "get")
      .mockImplementation(() => supervisorPseudoId);
    store = new OutliersSupervisionStore(
      new RootStore().outliersStore,
      OutliersConfigFixture
    );
    presenter = new SupervisionOfficerDetailPresenter(store, officerPseudoId);
    await presenter?.hydrate();
  });

  test("analytics trackOutliersStaffPageViewed", () => {
    jest.spyOn(AnalyticsStore.prototype, "trackOutliersStaffPageViewed");

    render(
      <BrowserRouter>
        <StaffPageWithPresenter presenter={presenter} />
      </BrowserRouter>
    );

    expect(
      store.outliersStore.rootStore.analyticsStore.trackOutliersStaffPageViewed
    ).toHaveBeenCalledWith({
      numOutlierMetrics: 2,
      staffPseudonymizedId: officerPseudoId,
      supervisorPseudonymizedId: supervisorPseudoId,
      viewedBy: supervisorPseudoId,
    });
  });
});
