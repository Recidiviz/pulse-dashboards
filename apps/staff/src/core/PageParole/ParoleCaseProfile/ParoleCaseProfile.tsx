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
import { ConductHistorySection } from "../components/ConductHistorySection";
import { IdentityHeaderSection } from "../components/IdentityHeaderSection";

// Page-level max-width/padding comes from PageParole's shared Main wrapper;
// this only lays out the sections within it.
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  padding-bottom: 1.5rem;
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

      <IdentityHeaderSection
        name={caseDetail.name}
        docId={caseDetail.docId}
        dob={caseDetail.dob}
        hearingDate={caseDetail.hearingDate}
        hearingTime={caseDetail.hearingTime}
        currentFacility={caseDetail.currentFacility}
        custodyLevel={caseDetail.custodyLevel}
        caseManagerName={caseDetail.caseManagerName}
        sentenceStartDate={caseDetail.sentenceStartDate}
        paroleEligibilityDate={caseDetail.paroleEligibilityDate}
        mandatoryReleaseDate={caseDetail.mandatoryReleaseDate}
      />

      <AttachmentsSection
        parolePlan={caseDetail.parolePlan}
        attachments={caseDetail.attachments}
      />

      <ConductHistorySection conductHistory={caseDetail.conductHistory} />
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
