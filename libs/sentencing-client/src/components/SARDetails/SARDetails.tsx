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
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import { SentencingStore } from "../../datastores/SentencingStore";
import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { sarUrl } from "../../utils/routing";
import { formatDisplayDate } from "../../utils/utils";
import { CaseInformation } from "../CaseInformation/CaseInformation";
import { KeyConsiderations } from "../KeyConsiderations";
import { OffenderAssessment } from "../OffenderAssessment";
import { PriorTreatmentHistorySection } from "../OffenderAssessment/PriorTreatmentHistory/PriorTreatmentHistorySection";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { Recommendation } from "../Recommendation";
import { Banner } from "../shared/styles/Banner";
import { TopProgressBar } from "../shared/TopProgressBar";
import { SkippableTextSection } from "../SkippableTextSection";
import { StoreProvider } from "../StoreProvider/StoreProvider";
import { Summary } from "../Summary/Summary";
import { SARSection, SARSectionName } from "./constants";
import * as Styled from "./SARDetails.styles";
import { SARHeader } from "./SARHeader";
import { SARSideNavigation } from "./SARSideNavigation";

const SARSectionContent: React.FC<{
  currentSection: SARSectionName;
  currentSubsection?: string;
  presenter: SARDetailsPresenter;
}> = observer(function SARSectionContent({
  currentSection,
  currentSubsection,
  presenter,
}) {
  if (currentSection === SARSection.OFFENDER_ASSESSMENT) {
    return (
      <OffenderAssessment
        presenter={presenter}
        currentSubsection={currentSubsection}
      />
    );
  }
  if (currentSection === SARSection.PRIOR_TREATMENT_HISTORY) {
    return (
      <PriorTreatmentHistorySection
        presenter={presenter.priorTreatmentHistory}
      />
    );
  }

  if (currentSection === SARSection.SUMMARY) {
    return <Summary presenter={presenter} />;
  }

  return (
    <Styled.MainContent>
      {currentSection === SARSection.CASE_INFORMATION && (
        <CaseInformation presenter={presenter} />
      )}
      {currentSection === SARSection.KEY_CONSIDERATIONS && (
        <KeyConsiderations presenter={presenter} />
      )}
      {currentSection === SARSection.DEFENDANTS_VERSION && (
        <SkippableTextSection
          presenter={presenter}
          title="Enter Defendant's Version"
          fieldName="defendantStatement"
          disabled={!!presenter.SARData?.completionDate}
          placeholder={
            presenter.defendantDeclinedToParticipate === true
              ? "Since the client declined to participate, please write a short paragraph describing your attempts to contact the client."
              : "Please add the details of the Defendant's version"
          }
        />
      )}
      {currentSection === SARSection.VICTIM_IMPACT && (
        <SkippableTextSection
          presenter={presenter}
          title="Enter Victim Impact Statement"
          fieldName="victimImpactStatement"
          placeholder="Please add the Victim Impact here"
          disabled={!!presenter.SARData?.completionDate}
        />
      )}
      {currentSection === SARSection.RECOMMENDATION && (
        <Recommendation presenter={presenter} />
      )}
    </Styled.MainContent>
  );
});

const SARDetailsWithPresenter = observer(function SARDetailsWithPresenter({
  presenter,
}: {
  presenter: SARDetailsPresenter;
}) {
  const navigate = useNavigate();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState<SARSectionName>(
    SARSection.CASE_INFORMATION,
  );
  const [currentSubsection, setCurrentSubsection] = useState<
    string | undefined
  >();

  useLayoutEffect(() => {
    if (pageContainerRef.current) pageContainerRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [currentSection]);

  const { staffPseudoId, SARAttributes, formattedGender, offenseNames } =
    presenter;

  useEffect(() => {
    presenter.trackSARCaseDetailsPageViewed();
  }, [presenter]);

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
    <Styled.PageContainer ref={pageContainerRef}>
      <TopProgressBar percentage={presenter.overallProgress} />

      <SARHeader
        SARAttributes={SARAttributes}
        onBackToDashboard={handleBackToDashboard}
        formattedGender={formattedGender}
        offenseNames={offenseNames}
      />

      <Styled.ReportBuilderLayout>
        <SARSideNavigation
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          currentSubsection={currentSubsection}
          onSubsectionChange={setCurrentSubsection}
          presenter={presenter}
        />

        <Styled.ContentLayout>
          {presenter.SARData?.completionDate && (
            <Banner>
              This investigation was completed on{" "}
              {formatDisplayDate(presenter.SARData.completionDate)} and the
              report can no longer be edited.
            </Banner>
          )}

          <SARSectionContent
            key={currentSection}
            currentSection={currentSection}
            currentSubsection={currentSubsection}
            presenter={presenter}
          />
        </Styled.ContentLayout>
      </Styled.ReportBuilderLayout>
    </Styled.PageContainer>
  );
});

export const SARDetails: React.FC<{
  sentencingStore: SentencingStore;
}> = observer(function SARDetails({ sentencingStore }) {
  const params = useParams();
  const sarId = params["sarId"];

  const presenter = useMemo(
    () => (sarId ? new SARDetailsPresenter(sentencingStore, sarId) : null),
    [sentencingStore, sarId],
  );

  useEffect(() => {
    return () => presenter?.dispose();
  }, [presenter]);

  if (!presenter) {
    return <Styled.PageContainer>No SAR ID found.</Styled.PageContainer>;
  }

  return (
    <PageHydrator hydratable={presenter}>
      <StoreProvider store={sentencingStore}>
        <SARDetailsWithPresenter presenter={presenter} />
      </StoreProvider>
    </PageHydrator>
  );
});
