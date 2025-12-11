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

import { ErrorPage } from "@recidiviz/design-system";
import { ErrorBoundary } from "@sentry/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { SARDetails, sarRoute, SARStaffDashboard, sarUrl, StoreProvider } from "~sentencing-client";

import NotFound from "../../components/NotFound";
import {
  PartiallyTypedRootStore,
  useRootStore,
} from "../../components/StoreProvider";
import { StaffDashboardPageLayout } from "../StaffDashboardPageLayout";


const PageSAR: React.FC = function PageSAR() {
  // TODO(#5636) Eliminate PartiallyTypedRootStore
  const { sentencingStore } = useRootStore() as PartiallyTypedRootStore;
  const STAFF_DASHBOARD_URL = sarUrl(
    "staffDashboard",
    { staffPseudoId: sentencingStore.staffPseudoId }
  );
  return (
    <ErrorBoundary
      fallback={
        <ErrorPage headerText="Sorry, it looks like something went wrong...">
          Please try refreshing the page or reach out to your contact at
          Recidiviz for more assistance.
        </ErrorPage>
      }
    >
      <StoreProvider store={sentencingStore}>
        <StaffDashboardPageLayout>
          <Routes>
           <Route
              index
              element={<Navigate replace to={STAFF_DASHBOARD_URL} />}
            />
            {/* SAR Routes */}
            <Route
              path={sarRoute({ routeName: "staffDashboard" })}
              element={<SARStaffDashboard sentencingStore={sentencingStore} />}
            />
            <Route
              path={sarRoute({ routeName: "sarDetails" })}
              element={<SARDetails sentencingStore={sentencingStore} />}
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </StaffDashboardPageLayout>
      </StoreProvider>
    </ErrorBoundary>
  );
};

export default observer(PageSAR);
