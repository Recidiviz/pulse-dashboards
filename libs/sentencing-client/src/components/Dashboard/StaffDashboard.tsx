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

import { useState } from "react";

import CloseIcon from "../assets/close-icon.svg?react";
import { CaseListTable } from "./CaseListTable";
import * as Styled from "./Dashboard.styles";
import { StaffDashboardProps } from "./types";

export const StaffDashboard: React.FC<StaffDashboardProps> = (
  staffDashboardProps,
) => {
  const {
    staffInfo,
    staffPseudoId,
    caseTableData,
    geoConfig,
    setIsFirstLogin,
    trackIndividualCaseClicked,
    trackRecommendationStatusFilterChanged,
    trackDashboardSortOrderChanged,
  } = staffDashboardProps;

  const [showWelcomeMessage, setShowWelcomeMessage] = useState(
    !staffInfo?.hasLoggedIn,
  );

  const handleFirstLogin = () => {
    if (!staffInfo?.hasLoggedIn) {
      setIsFirstLogin();
      setShowWelcomeMessage(false);
    }
  };

  if (!caseTableData) return null;

  return (
    <>
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
          caseTableData={caseTableData}
          staffPseudoId={staffPseudoId}
          excludedAttributeKeys={geoConfig.excludedAttributeKeys}
          analytics={{
            trackIndividualCaseClicked,
            trackRecommendationStatusFilterChanged,
            trackDashboardSortOrderChanged,
          }}
        />
      </Styled.Cases>
    </>
  );
};
