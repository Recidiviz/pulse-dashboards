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
import { useState } from "react";

import { withPresenterManager } from "~hydration-utils";

import { PSIStore } from "../../datastores/PSIStore";
import { StaffPresenter } from "../../presenters/StaffPresenter";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import * as Styled from "./Dashboard.styles";
import { StaffDashboard } from "./StaffDashboard";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { StaffDashboardProps } from "./types";

const ManagedComponent = observer(function Dashboard({
  presenter,
}: {
  presenter: StaffPresenter;
}) {
  const {
    staffInfo,
    supervisorInfo,
    staffPseudoId,
    caseTableData,
    geoConfig,
    setIsFirstLogin,
    trackDashboardPageViewed,
    trackIndividualCaseClicked,
    trackRecommendationStatusFilterChanged,
    trackDashboardSortOrderChanged,
  } = presenter;

  const [initialPageLoad, setInitialPageLoad] = useState(true);

  if (!staffPseudoId) return null;

  if (initialPageLoad) {
    trackDashboardPageViewed();
    setInitialPageLoad(false);
  }

  const staffDashboardProps: StaffDashboardProps = {
    staffInfo,
    staffPseudoId,
    caseTableData,
    geoConfig,
    setIsFirstLogin,
    trackIndividualCaseClicked,
    trackRecommendationStatusFilterChanged,
    trackDashboardSortOrderChanged,
  };

  return (
    <Styled.PageContainer>
      {presenter.isSupervisor ? (
        <SupervisorDashboard
          supervisorStats={supervisorInfo?.supervisorDashboardStats}
        />
      ) : (
        <StaffDashboard {...staffDashboardProps} />
      )}
    </Styled.PageContainer>
  );
});

function usePresenter({ psiStore }: { psiStore: PSIStore }) {
  const { staffStore } = psiStore;

  return new StaffPresenter(staffStore);
}

export const Dashboard = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: PageHydrator,
});
