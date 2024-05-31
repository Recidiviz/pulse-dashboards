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
import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { SupervisionPresenter } from "../../InsightsStore/presenters/SupervisionPresenter";
import InsightsNavLayout from "../InsightsNavLayout";
import InsightsOnboardingPage from "../InsightsOnboardingPage";
import { InsightsRoute } from "../InsightsRoute";
import InsightsStaffPage from "../InsightsStaffPage";
import { InsightsSupervisionHome } from "../InsightsSupervisionHome";
import InsightsSupervisorPage from "../InsightsSupervisorPage";
import InsightsSupervisorPageV2 from "../InsightsSupervisorPage/InsightsSupervisorPageV2";
import InsightsSupervisorsListPage from "../InsightsSupervisorsListPage";
import ModelHydrator from "../ModelHydrator";
import { insightsRoute } from "../views";

// memo is used to prevent re-rendering the entire component on route changes
const PageInsights: React.FC = memo(function PageInsights() {
  window.scrollTo({
    top: 0,
  });
  const { supervisorHomepage } = useFeatureVariants();
  const { insightsStore } = useRootStore();

  return (
    <InsightsNavLayout>
      <ModelHydrator model={new SupervisionPresenter(insightsStore)}>
        <Routes>
          <Route element={<InsightsRoute />}>
            <Route
              path={insightsRoute({ routeName: "supervision" })}
              element={<InsightsSupervisionHome />}
            />
            <Route
              path={insightsRoute({ routeName: "supervisionSupervisorsList" })}
              element={<InsightsSupervisorsListPage />}
            />

            <Route
              path={insightsRoute({ routeName: "supervisionSupervisor" })}
              element={
                supervisorHomepage ? (
                  <InsightsSupervisorPageV2 />
                ) : (
                  <InsightsSupervisorPage />
                )
              }
            />

            {[
              insightsRoute({ routeName: "supervisionStaff" }),
              insightsRoute({ routeName: "supervisionStaffMetric" }),
              insightsRoute({ routeName: "supervisionClientDetail" }),
            ].map((path) => (
              <Route key={path} path={path} element={<InsightsStaffPage />} />
            ))}
          </Route>
          <Route
            path={insightsRoute({ routeName: "supervisionOnboarding" })}
            element={<InsightsOnboardingPage />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ModelHydrator>
    </InsightsNavLayout>
  );
});

export default PageInsights;
