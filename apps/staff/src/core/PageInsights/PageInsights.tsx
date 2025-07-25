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

import { observer } from "mobx-react-lite";
import React from "react";
import { Route, Routes } from "react-router-dom";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import { SupervisionPresenter } from "../../InsightsStore/presenters/SupervisionPresenter";
import { InsightsActionStrategyModalProvider } from "../InsightsActionStrategyModal";
import InsightsMetricPage from "../InsightsMetricPage";
import InsightsNavLayout from "../InsightsNavLayout";
import InsightsOnboardingPage from "../InsightsOnboardingPage";
import InsightsOpportunityFormPage from "../InsightsOpportunityFormPage";
import InsightsOpportunityPage from "../InsightsOpportunityPage";
import { InsightsRoute } from "../InsightsRoute";
import InsightsStaffPageV2 from "../InsightsStaffPage/InsightsStaffPageV2";
import { InsightsSupervisionHome } from "../InsightsSupervisionHome";
import InsightsSupervisorPageV2 from "../InsightsSupervisorPage/InsightsSupervisorPageV2";
import InsightsSupervisorsListPage from "../InsightsSupervisorsListPage";
import ModelHydrator from "../ModelHydrator";
import { insightsRoute } from "../views";
import { OpportunitySidePanelProvider } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunitySidePanelContext";

const PageInsights: React.FC = observer(function PageInsights() {
  window.scrollTo({
    top: 0,
  });
  const { insightsStore, workflowsRootStore } = useRootStore();

  return (
    <InsightsActionStrategyModalProvider>
      <OpportunitySidePanelProvider>
        <InsightsNavLayout>
          <ModelHydrator
            hydratable={
              new SupervisionPresenter(insightsStore, workflowsRootStore)
            }
          >
            <Routes>
              <Route element={<InsightsRoute />}>
                <Route
                  path={insightsRoute({ routeName: "supervision" })}
                  element={<InsightsSupervisionHome />}
                />
                <Route
                  path={insightsRoute({
                    routeName: "supervisionSupervisorsList",
                  })}
                  element={<InsightsSupervisorsListPage />}
                />

                <Route
                  path={insightsRoute({ routeName: "supervisionSupervisor" })}
                  element={<InsightsSupervisorPageV2 />}
                />

                {
                  <Route
                    path={insightsRoute({ routeName: "supervisionStaff" })}
                    element={<InsightsStaffPageV2 />}
                  />
                }

                {[
                  insightsRoute({ routeName: "supervisionStaffMetric" }),
                  insightsRoute({ routeName: "supervisionClientDetail" }),
                ].map((path) => (
                  <Route
                    key={path}
                    path={path}
                    element={<InsightsMetricPage />}
                  />
                ))}
                <Route
                  path={insightsRoute({ routeName: "supervisionOpportunity" })}
                  element={<InsightsOpportunityPage />}
                />
                <Route
                  path={insightsRoute({
                    routeName: "supervisionOpportunityForm",
                  })}
                  element={<InsightsOpportunityFormPage />}
                />
              </Route>
              <Route
                path={insightsRoute({ routeName: "supervisionOnboarding" })}
                element={<InsightsOnboardingPage />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ModelHydrator>
        </InsightsNavLayout>
      </OpportunitySidePanelProvider>
    </InsightsActionStrategyModalProvider>
  );
});

export default PageInsights;
