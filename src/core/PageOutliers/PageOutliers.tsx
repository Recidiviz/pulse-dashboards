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

import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";

import OutliersHomepage from "../OutliersHomepage/OutliersHomepage";
import OutliersStaff from "../OutliersStaff/OutliersStaff";
import OutliersStaffMetric from "../OutliersStaffMetric/OutliersStaffMetric";
import OutliersSupervisor from "../OutliersSupervisor/OutliersSupervisor";
import OutliersSupervisorSearch from "../OutliersSupervisorSearch/OutliersSupervisorSearch";
import { DASHBOARD_PATHS, OUTLIERS_PATHS } from "../views";

const PageOutliers: React.FC = () => {
  return (
    <Switch>
      <Redirect
        exact
        from={DASHBOARD_PATHS.outliers}
        to={OUTLIERS_PATHS.supervision}
      />
      <Route
        exact
        path={OUTLIERS_PATHS.supervision}
        component={OutliersHomepage}
      />
      <Route
        exact
        path={OUTLIERS_PATHS.supervisionSupervisorSearch}
        component={OutliersSupervisorSearch}
      />
      <Route
        exact
        path={OUTLIERS_PATHS.supervisionSupervisor}
        component={OutliersSupervisor}
      />
      <Route
        exact
        path={OUTLIERS_PATHS.supervisionStaff}
        component={OutliersStaff}
      />
      <Route
        exact
        path={OUTLIERS_PATHS.supervisionStaffMetric}
        component={OutliersStaffMetric}
      />
    </Switch>
  );
};

export default PageOutliers;
