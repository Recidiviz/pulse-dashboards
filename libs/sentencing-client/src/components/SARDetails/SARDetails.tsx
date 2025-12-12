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
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { SentencingStore } from "../../datastores/SentencingStore";
import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { sarUrl } from "../../utils/routing";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { StoreProvider } from "../StoreProvider/StoreProvider";
import { SARSection, SARSectionName } from "./constants";
import * as Styled from "./SARDetails.styles";
import { SARHeader } from "./SARHeader";
import { SARSideNavigation } from "./SARSideNavigation";

const SARDetailsWithPresenter = observer(function SARDetailsWithPresenter({
  presenter,
}: {
  presenter: SARDetailsPresenter;
}) {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState<SARSectionName>(
    SARSection.CASE_INFORMATION,
  );

  const { staffPseudoId, SARAttributes, formattedGender, offenseNames } =
    presenter;

  const handleBackToDashboard = () => {
    if (staffPseudoId) {
      navigate(
        sarUrl("staffDashboard", {
          staffPseudoId,
        }),
      );
    }
  };

  return (
    <Styled.PageContainer>
      <SARHeader
        SARAttributes={SARAttributes}
        onBackToDashboard={handleBackToDashboard}
        formattedGender={formattedGender}
        offenseNames={offenseNames}
      />

      <Styled.ContentLayout>
        <SARSideNavigation
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
        />

        <Styled.MainContent>
          <h2>{currentSection}</h2>
          {/* Form builder content will go here based on currentSection */}
          <p>Content for {currentSection} goes here...</p>
        </Styled.MainContent>
      </Styled.ContentLayout>
    </Styled.PageContainer>
  );
});

export const SARDetails: React.FC<{
  sentencingStore: SentencingStore;
}> = observer(function SARDetails({ sentencingStore }) {
  const params = useParams();

  if (!params["sarId"]) {
    return <Styled.PageContainer>No SAR ID found.</Styled.PageContainer>;
  }

  const presenter = new SARDetailsPresenter(sentencingStore, params["sarId"]);

  return (
    <PageHydrator hydratable={presenter}>
      <StoreProvider store={sentencingStore}>
        <SARDetailsWithPresenter presenter={presenter} />
      </StoreProvider>
    </PageHydrator>
  );
});
