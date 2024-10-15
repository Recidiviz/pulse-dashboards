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

import {
  animation,
  Button,
  Icon,
  Loading,
  Modal,
  palette,
  Sans14,
  Sans16,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import * as Sentry from "@sentry/react";
import { Timestamp } from "firebase/firestore";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import useClipboard from "react-use-clipboard";
import styled from "styled-components/macro";

import { Client, UsTnExpirationOpportunity } from "../../WorkflowsStore";
import {
  PagePreview,
  SmallPagePreviewWithHover,
} from "../controls/WorkflowsNotePreview";

const TOMIS_FONT_FAMILY = "Verdana, sans-serif";

const StyledModal = styled(Modal)`
  .ReactModal__Content {
    padding: 0;
    max-width: 85vw;
    width: ${rem(740)};
    min-height: ${rem(500)};
    display: flex;
    flex-direction: column;
  }
`;

const CenteredContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const ModalTitle = styled(Sans24)`
  color: ${palette.pine1};
  padding: ${rem(spacing.md)} ${rem(spacing.xl)};
`;

const ModalControls = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.lg)} ${rem(spacing.sm)};
  text-align: right;
`;

const PreviewArea = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  margin: ${rem(spacing.md)} 0px;
  background-color: ${palette.marble3};
  font-family: ${TOMIS_FONT_FAMILY};
`;

const ClientName = styled.span`
  font-size: ${rem(18)};
  color: ${palette.pine1};
  margin-right: ${rem(spacing.md)};
`;

const ClientID = styled.span`
  font-size: ${rem(18)};
`;

const ContactTypes = styled.div`
  font-size: ${rem(14)};
  padding: ${rem(spacing.md)} 0px;
  color: ${palette.pine1};
`;

const PagesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.xs)};
  margin: ${rem(spacing.sm)} 0px 0px;
`;

const ActionButton = styled(Button).attrs({ kind: "primary", shape: "block" })`
  margin: ${rem(spacing.lg)} ${rem(spacing.xl)} ${rem(spacing.sm)};
  padding: ${rem(spacing.md)};
  align-self: flex-start;
  flex: none;
`;

const Disclaimer = styled(Sans14)`
  color: ${palette.slate80};
  padding: ${rem(spacing.sm)} ${rem(spacing.xl)} ${rem(spacing.lg)};
`;

const ModalText = styled(Sans16)`
  color: ${palette.slate80};
`;

const OKButton = styled(Button)`
  padding: ${rem(spacing.md)} ${rem(60)};
`;

type writeToTOMISModalProps = {
  showModal: boolean;
  onCloseFn: () => void;
  paginatedNote: string[][];
  opportunity: UsTnExpirationOpportunity;
  showSubmitPage: boolean;
};

export function createContactNoteRequestBody(
  opportunity: UsTnExpirationOpportunity,
  person: Client,
  contactNoteObj: Record<number, string[]>,
  contactNoteDateTime: Date,
) {
  const staffId = opportunity.rootStore.workflowsStore.user?.info.id;
  const votersRightsCode = opportunity.form.formData.contactTypes
    ?.split(", ")
    .filter((code) => code !== "TEPE");

  // In non-production environments and requests by recidiviz users, the personExternalId and staffId will be overriden in the backend.
  return {
    personExternalId: person.externalId,
    staffId,
    contactNote: contactNoteObj,
    contactNoteDateTime,
    ...(votersRightsCode?.length && {
      votersRightsCode: votersRightsCode[0],
    }),
  };
}

export const WriteToTOMISModal = observer(function WriteToTOMISModal({
  showModal,
  onCloseFn,
  paginatedNote,
  opportunity,
  showSubmitPage,
}: writeToTOMISModalProps) {
  const [pageNumberSelected, setPageNumberSelected] = useState(0);
  const {
    person,
    rootStore: {
      firestoreStore,
      analyticsStore,
      workflowsStore: { currentUserEmail },
    },
  } = opportunity;

  const [isCopied, copyToClipboard] = useClipboard(
    paginatedNote[pageNumberSelected].join("\n"),
    {
      successDuration: animation.extendedDurationMs,
    },
  );

  const onCopyButtonClick = () => {
    copyToClipboard();
    opportunity.setCompletedIfEligible();
    analyticsStore.trackReferralFormCopiedToClipboard({
      justiceInvolvedPersonId: opportunity.person.pseudonymizedId,
      opportunityType: opportunity.type,
      opportunityId: opportunity.sentryTrackingId,
    });
  };

  const submitTEPEContactNote = async function (body: Record<string, unknown>) {
    return opportunity.rootStore.apiStore.post(
      `${import.meta.env.VITE_NEW_BACKEND_API_URL}/workflows/external_request/${opportunity.rootStore.userStore.stateCode}/insert_tepe_contact_note`,
      body,
    );
  };

  const onWriteButtonClick = () => {
    const contactNoteObj: Record<number, string[]> = Object.fromEntries(
      paginatedNote.map((page, index) => [Number(index + 1), page]),
    );
    const contactNoteDateTime = new Date();

    const contactNoteRequestBody = createContactNoteRequestBody(
      opportunity,
      person,
      contactNoteObj,
      contactNoteDateTime,
    );

    firestoreStore.updateUsTnExpirationContactNoteStatus(
      opportunity,
      currentUserEmail,
      person.recordId,
      contactNoteObj,
      Timestamp.fromDate(contactNoteDateTime),
      "PENDING",
    );

    submitTEPEContactNote(contactNoteRequestBody)
      .then((_) => {
        opportunity.setCompletedIfEligible();
        analyticsStore.trackReferralFormSubmitted({
          justiceInvolvedPersonId: opportunity.person.pseudonymizedId,
          opportunityType: opportunity.type,
          opportunityId: opportunity.sentryTrackingId,
        });
      })
      .catch((e: Error) => {
        firestoreStore.updateUsTnExpirationContactNoteStatus(
          opportunity,
          currentUserEmail,
          person.recordId,
          contactNoteObj,
          Timestamp.fromDate(contactNoteDateTime),
          "FAILURE",
          e.message,
        );
        Sentry.captureException(e);
      });
  };

  const closeButtonControls = (
    <ModalControls>
      <Button kind="link" onClick={onCloseFn}>
        <Icon kind="Close" size="14" color={palette.pine2} />
      </Button>
    </ModalControls>
  );

  const loadingModal = (
    <CenteredContainer className="LoadingModal">
      {/* Styled components don't seem to work with <Loading>, which expands to fill all available area.
      Put a non-flex div around it to reduce the size of the container it's filling. */}
      <div>
        <Loading showMessage={false} />
      </div>
      <ModalTitle>Submitting notes to TOMIS...</ModalTitle>
      <ModalText>
        This can take up to 30 seconds.
        <br />
        Do not refresh the page.
      </ModalText>
    </CenteredContainer>
  );

  const success = (
    <>
      {closeButtonControls}
      <CenteredContainer>
        <Icon kind="Success" size="44" color={palette.signal.highlight} />
        <br />
        <br />
        <ModalTitle>{`${paginatedNote.length}-page TEPE note successfully submitted`}</ModalTitle>
        <ModalText>View them in TOMIS</ModalText>
        <br />
        <br />
        <OKButton onClick={onCloseFn} shape="block">
          Got it
        </OKButton>
      </CenteredContainer>
    </>
  );

  const previewArea = (
    <PreviewArea className="fs-exclude">
      <ClientName>{person.displayName}</ClientName>
      <ClientID>{person.externalId}</ClientID>
      <ContactTypes>
        Contact Types: {opportunity.form.formData.contactTypes}
      </ContactTypes>
      <PagePreview className="TEPEPagePreview">
        {paginatedNote[pageNumberSelected].join("\n")}
      </PagePreview>
      <PagesContainer>
        {paginatedNote.map((page, index) => (
          <SmallPagePreviewWithHover
            className="TEPESmallPagePreview"
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            onClick={() => {
              setPageNumberSelected(index);
            }}
            selected={index === pageNumberSelected}
          >
            {page.join("\n")}
          </SmallPagePreviewWithHover>
        ))}
      </PagesContainer>
    </PreviewArea>
  );

  const submissionModal = (
    <>
      {closeButtonControls}
      <ModalTitle>
        Review {paginatedNote.length} pages and submit TEPE note to eTomis
      </ModalTitle>
      {previewArea}
      <ActionButton onClick={onWriteButtonClick}>
        Submit note to eTomis
      </ActionButton>
      <Disclaimer>
        {/* TODO(#2947): Make it sound less awkward for one page. */}
        This note has {paginatedNote.length} page(s). When you click submit, all{" "}
        {paginatedNote.length} page(s) will be submitted at once directly into
        eTomis as a contact note. Once submitted, you will only be able to make
        any further edits to these notes directly in eTomis.
      </Disclaimer>
    </>
  );

  const failureModal = (
    <div className="FailureModal" style={{ width: "100%" }}>
      {closeButtonControls}
      <ModalTitle>
        <Icon kind="Error" size="44" color={palette.signal.error} />
        <br />
        <br /> Note did not submit to TOMIS
      </ModalTitle>
      <ModalText
        style={{ padding: `0px ${rem(spacing.xl)} ${rem(spacing.sm)}` }}
      >
        Copy each page of the note below and submit them directly in TOMIS
      </ModalText>
      {previewArea}
      <ActionButton
        onClick={onCopyButtonClick}
        style={{ marginBottom: `${rem(spacing.lg)}`, minWidth: "7vw" }}
      >
        {isCopied
          ? `Page ${pageNumberSelected + 1} copied!`
          : `Copy page ${pageNumberSelected + 1}`}
      </ActionButton>
    </div>
  );

  const copyModal = (
    <>
      {closeButtonControls}
      <ModalTitle>
        Copy each page of the note below and submit in TOMIS
      </ModalTitle>
      {previewArea}
      <ActionButton
        onClick={onCopyButtonClick}
        style={{ marginBottom: `${rem(spacing.lg)}`, minWidth: "7vw" }}
      >
        {isCopied
          ? `Page ${pageNumberSelected + 1} copied!`
          : `Copy page ${pageNumberSelected + 1}`}
      </ActionButton>
      <Disclaimer>
        This note has {paginatedNote.length} pages. Make sure you copy and paste
        each of the {paginatedNote.length} pages into TOMIS prior to submitting
        the note.
      </Disclaimer>
    </>
  );

  const getModalContent = () => {
    if (!showSubmitPage) {
      return copyModal;
    }
    switch (opportunity.externalRequestStatus) {
      case "SUCCESS":
        return success;
      case "PENDING":
      case "IN_PROGRESS":
        return loadingModal;
      case "FAILURE":
        return failureModal;
      default:
        return submissionModal;
    }
  };

  return (
    <StyledModal
      isOpen={showModal}
      onRequestClose={onCloseFn}
      className="WriteToTOMISModal"
    >
      {getModalContent()}
    </StyledModal>
  );
});
