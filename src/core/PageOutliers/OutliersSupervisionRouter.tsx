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

import { Route, Switch } from "react-router-dom";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import { SupervisionPresenter } from "../../OutliersStore/presenters/SupervisionPresenter";
import ModelHydrator from "../ModelHydrator";
import { OutliersRoute } from "../OutliersRoute";
import OutliersStaffPage from "../OutliersStaffPage";
import { OutliersSupervisionHome } from "../OutliersSupervisionHome";
import OutliersSupervisorPage from "../OutliersSupervisorPage";
import OutliersSupervisorsListPage from "../OutliersSupervisorsListPage";
import { OUTLIERS_PATHS } from "../views";

export const OutliersSupervisionRouter = () => {
  const { outliersStore } = useRootStore();
  return (
    <ModelHydrator model={new SupervisionPresenter(outliersStore)}>
      <Switch>
        <Route exact path={OUTLIERS_PATHS.supervision}>
          <OutliersRoute>
            <OutliersSupervisionHome />
          </OutliersRoute>
        </Route>

        <Route exact path={OUTLIERS_PATHS.supervisionSupervisorsList}>
          <OutliersRoute>
            <OutliersSupervisorsListPage />
          </OutliersRoute>
        </Route>
        <Route exact path={OUTLIERS_PATHS.supervisionSupervisor}>
          <OutliersRoute>
            <OutliersSupervisorPage />
          </OutliersRoute>
        </Route>
        <Route exact path={OUTLIERS_PATHS.supervisionStaff}>
          <OutliersRoute>
            <OutliersStaffPage />
          </OutliersRoute>
        </Route>
        <Route
          exact
          path={[
            OUTLIERS_PATHS.supervisionStaff,
            OUTLIERS_PATHS.supervisionStaffMetric,
            OUTLIERS_PATHS.supervisionClientDetail,
          ]}
        >
          <OutliersRoute>
            <OutliersStaffPage />
          </OutliersRoute>
        </Route>
        <NotFound />
      </Switch>
    </ModelHydrator>
  );
};
