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
import { CaseInformation } from "../CaseInformation/CaseInformation";
import { KeyConsiderations } from "../KeyConsiderations";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { Recommendation } from "../Recommendation";
import { TopProgressBar } from "../shared/TopProgressBar";
import { SkippableTextSection } from "../SkippableTextSection";
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
      <TopProgressBar percentage={presenter.overallProgress} />

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
          presenter={presenter}
        />

        <Styled.MainContent>
          {(() => {
            if (currentSection === SARSection.CASE_INFORMATION) {
              return <CaseInformation presenter={presenter} />;
            }
            if (currentSection === SARSection.KEY_CONSIDERATIONS) {
              return <KeyConsiderations presenter={presenter} />;
            }
            if (currentSection === SARSection.DEFENDANTS_VERSION) {
              return (
                <SkippableTextSection
                  presenter={presenter}
                  title="Enter Defendant's Version"
                  fieldName="defendantStatement"
                  placeholder="Please add the details of the Defendant's version"
                />
              );
            }
            if (currentSection === SARSection.VICTIM_IMPACT) {
              return (
                <SkippableTextSection
                  presenter={presenter}
                  title="Enter Victim Impact Statement"
                  fieldName="victimImpactStatement"
                  placeholder="Please add the Victim Impact here"
                />
              );
            }
            if (currentSection === SARSection.RECOMMENDATION) {
              return <Recommendation presenter={presenter} />;
            }
            return (
              <>
                <h2>{currentSection}</h2>
                <p>Content for {currentSection} goes here...</p>
              </>
            );
          })()}
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
