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

import React, { memo } from "react";
import { Route, Routes } from "react-router-dom";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import { SupervisionPresenter } from "../../OutliersStore/presenters/SupervisionPresenter";
import ModelHydrator from "../ModelHydrator";
import OutliersNavLayout from "../OutliersNavLayout";
import OutliersOnboardingPage from "../OutliersOnboardingPage";
import { OutliersRoute } from "../OutliersRoute";
import OutliersStaffPage from "../OutliersStaffPage";
import { OutliersSupervisionHome } from "../OutliersSupervisionHome";
import OutliersSupervisorPage from "../OutliersSupervisorPage";
import OutliersSupervisorsListPage from "../OutliersSupervisorsListPage";
import { outliersRoute } from "../views";

// memo is used to prevent re-rendering the entire component on route changes
const PageOutliers: React.FC = memo(function PageOutliers() {
  window.scrollTo({
    top: 0,
  });
  const { outliersStore } = useRootStore();

  return (
    <OutliersNavLayout>
      <ModelHydrator model={new SupervisionPresenter(outliersStore)}>
        <Routes>
          <Route element={<OutliersRoute />}>
            <Route
              path={outliersRoute({ routeName: "supervision" })}
              element={<OutliersSupervisionHome />}
            />
            <Route
              path={outliersRoute({ routeName: "supervisionSupervisorsList" })}
              element={<OutliersSupervisorsListPage />}
            />

            <Route
              path={outliersRoute({ routeName: "supervisionSupervisor" })}
              element={<OutliersSupervisorPage />}
            />

            {[
              outliersRoute({ routeName: "supervisionStaff" }),
              outliersRoute({ routeName: "supervisionStaffMetric" }),
              outliersRoute({ routeName: "supervisionClientDetail" }),
            ].map((path) => (
              <Route key={path} path={path} element={<OutliersStaffPage />} />
            ))}
          </Route>
          <Route
            path={outliersRoute({ routeName: "supervisionOnboarding" })}
            element={<OutliersOnboardingPage />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ModelHydrator>
    </OutliersNavLayout>
  );
});

export default PageOutliers;
