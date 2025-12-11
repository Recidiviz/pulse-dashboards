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
import CloseIcon from "../assets/close-icon.svg?react";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { CaseListTable } from "./CaseListTable";
import * as Styled from "./Dashboard.styles";
import { PSI_DASHBOARD_COLUMNS } from "./utils/dashboardColumns";

const ManagedComponent = observer(function PSIStaffDashboard({
  presenter,
}: {
  presenter: StaffPresenter;
}) {
  const {
    staffInfo,
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
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(
    !staffInfo?.hasLoggedIn,
  );

  if (!staffPseudoId || !caseTableData) return null;

  if (initialPageLoad) {
    trackDashboardPageViewed();
    setInitialPageLoad(false);
  }

  const handleFirstLogin = () => {
    if (!staffInfo?.hasLoggedIn) {
      setIsFirstLogin();
      setShowWelcomeMessage(false);
    }
  };

  return (
    <Styled.PageContainer>
      {/* Welcome Message */}
      {showWelcomeMessage && (
        <Styled.WelcomeMessage>
          <Styled.TitleDescriptionWrapper>
            <Styled.WelcomeTitle>
              Welcome to your case dashboard!
            </Styled.WelcomeTitle>

            <Styled.WelcomeDescription>
              Generate informed case recommendations based on historical
              outcomes customized for each case. Find and suggest customized
              treatment and diversion opportunities for clients that will aid in
              their healing and set them up for success in the community.
            </Styled.WelcomeDescription>
          </Styled.TitleDescriptionWrapper>

          <Styled.CloseButton onClick={handleFirstLogin}>
            <CloseIcon />
          </Styled.CloseButton>
        </Styled.WelcomeMessage>
      )}

      {/* List of Cases */}
      <Styled.Cases>
        <CaseListTable
          columns={PSI_DASHBOARD_COLUMNS}
          caseTableData={caseTableData}
          staffPseudoId={staffPseudoId}
          title={"My Cases"}
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

function usePresenter({
  sentencingStore,
}: {
  sentencingStore: SentencingStore;
}) {
  const { staffStore } = sentencingStore;

  return new StaffPresenter(staffStore);
}

export const PSIStaffDashboard = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: PageHydrator,
});
