// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { SentencingStore } from "../../datastores/SentencingStore";
import { StaffPresenter } from "../../presenters/StaffPresenter";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { CaseListTable } from "./CaseListTable";
import * as Styled from "./Dashboard.styles";
import { SAR_DASHBOARD_COLUMNS } from "./utils/dashboardColumns";

const ManagedComponent = observer(function SARStaffDashboard({
  presenter,
}: {
  presenter: StaffPresenter;
}) {
  const {
    staffPseudoId,
    sarTableData,
    geoConfig,
    trackDashboardPageViewed,
    trackIndividualCaseClicked,
    trackRecommendationStatusFilterChanged,
    trackDashboardSortOrderChanged,
  } = presenter;

  const [initialPageLoad, setInitialPageLoad] = useState(true);

  if (!staffPseudoId || !sarTableData) return null;

  if (initialPageLoad) {
    trackDashboardPageViewed();
    setInitialPageLoad(false);
  }


  return (
    <Styled.PageContainer>
      <Styled.Cases>
        <CaseListTable
          columns={SAR_DASHBOARD_COLUMNS}
          caseTableData={sarTableData}
          staffPseudoId={staffPseudoId}
          isSAR={true}
          title={"Sentencing Assessment Report Dashboard"}
          excludedAttributeKeys={geoConfig.excludedAttributeKeys}
          analytics={{
            trackIndividualCaseClicked,
            trackRecommendationStatusFilterChanged,
            trackDashboardSortOrderChanged,
          }}
        />
      </Styled.Cases>
    </Styled.PageContainer>
  );
});

function usePresenter({ sentencingStore }: { sentencingStore: SentencingStore }) {
  const { staffStore } = sentencingStore;
  return new StaffPresenter(staffStore);
}

export const SARStaffDashboard = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: PageHydrator,
});
