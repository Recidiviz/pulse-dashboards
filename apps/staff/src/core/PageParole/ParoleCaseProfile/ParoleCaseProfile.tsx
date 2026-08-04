// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";

import NotFound from "../../../components/NotFound";
import { useRootStore } from "../../../components/StoreProvider";
import { ParoleStore } from "../../../ParoleStore/ParoleStore";
import { ParoleCaseProfilePresenter } from "../../../ParoleStore/presenters/ParoleCaseProfilePresenter";
import { BackLink } from "../../Link";
import ModelHydrator from "../../ModelHydrator";
import { paroleUrl } from "../../views";
import { AttachmentsSection } from "../components/AttachmentsSection";
import { CaseProfileSidebar } from "../components/CaseProfileSidebar";
import { ConductHistorySection } from "../components/ConductHistorySection";
import { OffenseHistorySection } from "../components/OffenseHistorySection";
import { ProgramParticipationSection } from "../components/ProgramParticipationSection";
import { RiskAssessmentSection } from "../components/RiskAssessmentSection";
import { PAROLE_SECTION_IDS, SectionAnchor } from "../components/shared";

// Page-level max-width/padding comes from PageParole's shared Main wrapper;
// this only lays out the sections within it.
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  padding-bottom: 1.5rem;
`;

// Left sidebar takes up 30% of the available width; the existing sections
// share the rest. No align-items override here (default is stretch) so the
// sidebar's height matches the taller MainColumn, giving its sticky section
// nav room to travel as the page scrolls.
const CaseProfileLayout = styled.div`
  display: flex;
  gap: ${rem(spacing.lg)};
`;

const SidebarColumn = styled.div`
  flex: 0 0 30%;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const MainColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

const ParoleCaseProfileContents = observer(function ParoleCaseProfileContents({
  presenter,
}: {
  presenter: ParoleCaseProfilePresenter;
}) {
  // ModelHydrator only renders this component once hydration has succeeded,
  // so `presenter.caseDetail` is safe to access here -- but NOT at the call
  // site below, where it would be evaluated eagerly on every render pass.
  const { caseDetail } = presenter;

  return (
    <Wrapper>
      <BackLink fallbackUrl={paroleUrl("docket")}>Back to Docket</BackLink>

      <CaseProfileLayout>
        <SidebarColumn>
          <CaseProfileSidebar
            name={caseDetail.name}
            docId={caseDetail.docId}
            custodyLevel={caseDetail.custodyLevel}
            gender={caseDetail.gender}
            dob={caseDetail.dob}
            hearingDate={caseDetail.hearingDate}
            currentFacility={caseDetail.currentFacility}
            caseManagerName={caseDetail.caseManagerName}
            sentenceStartDate={caseDetail.sentenceStartDate}
            paroleEligibilityDate={caseDetail.paroleEligibilityDate}
            mandatoryReleaseDate={caseDetail.mandatoryReleaseDate}
          />
        </SidebarColumn>

        <MainColumn>
          <SectionAnchor id={PAROLE_SECTION_IDS.offenseHistory}>
            <OffenseHistorySection offenseHistory={caseDetail.offenseHistory} />
          </SectionAnchor>

          <SectionAnchor id={PAROLE_SECTION_IDS.riskAssessment}>
            <RiskAssessmentSection
              riskAssessments={caseDetail.riskAssessments}
              riskOverviewHistory={caseDetail.riskOverviewHistory}
            />
          </SectionAnchor>

          <SectionAnchor id={PAROLE_SECTION_IDS.programParticipation}>
            <ProgramParticipationSection
              docPrograms={caseDetail.docPrograms}
              edovoPrograms={caseDetail.edovoPrograms}
            />
          </SectionAnchor>

          <SectionAnchor id={PAROLE_SECTION_IDS.conductHistory}>
            <ConductHistorySection conductHistory={caseDetail.conductHistory} />
          </SectionAnchor>

          <SectionAnchor id={PAROLE_SECTION_IDS.attachments}>
            <AttachmentsSection
              parolePlan={caseDetail.parolePlan}
              attachments={caseDetail.attachments}
            />
          </SectionAnchor>
        </MainColumn>
      </CaseProfileLayout>
    </Wrapper>
  );
});

export function ParoleCaseProfile() {
  const { docId } = useParams<{ docId: string }>();
  const { paroleStore } = useRootStore();

  if (!docId) return <NotFound />;

  return <ParoleCaseProfileHydrator docId={docId} paroleStore={paroleStore} />;
}

function ParoleCaseProfileHydrator({
  docId,
  paroleStore,
}: {
  docId: string;
  paroleStore: ParoleStore;
}) {
  const [presenter] = useState(
    () => new ParoleCaseProfilePresenter(paroleStore, docId),
  );

  return (
    <ModelHydrator hydratable={presenter}>
      <ParoleCaseProfileContents presenter={presenter} />
    </ModelHydrator>
  );
}
