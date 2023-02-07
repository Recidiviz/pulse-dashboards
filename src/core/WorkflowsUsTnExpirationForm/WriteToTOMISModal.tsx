// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  Button,
  Icon,
  Loading,
  Modal,
  palette,
  Sans14,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import { Timestamp } from "firebase/firestore";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components/macro";

import { updateUsTnExpirationContactNoteSubmitted } from "../../firestore/firestore";
import { UsTnExpirationOpportunity } from "../../WorkflowsStore";
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
    justify-content: center;
    align-items: center;
  }
`;

const ModalTitle = styled(Sans24)`
  color: ${palette.pine2};
  padding: ${rem(spacing.md)} ${rem(spacing.xl)};
`;

const ModalControls = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)} ${rem(spacing.sm)};
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

const WriteButton = styled(Button)`
  margin: ${rem(spacing.lg)} ${rem(spacing.xl)} ${rem(spacing.sm)};
  padding: ${rem(spacing.md)};
`;

const Disclaimer = styled(Sans14)`
  color: ${palette.slate80};
  padding: ${rem(spacing.sm)} ${rem(spacing.xl)} ${rem(spacing.lg)};
`;

type writeToTOMISModalProps = {
  showModal: boolean;
  onCloseFn: () => void;
  paginatedNote: string[][];
  opportunity: UsTnExpirationOpportunity;
};

export const WriteToTOMISModal = observer(function WriteToTOMISModal({
  showModal,
  onCloseFn,
  paginatedNote,
  opportunity,
}: writeToTOMISModalProps) {
  const [pageNumberSelected, setPageNumberSelected] = useState(0);
  const { person, isNoteLoading } = opportunity;

  const submitTEPEContactNote = async function (body: Record<string, unknown>) {
    return opportunity.rootStore.apiStore.post(
      `${process.env.REACT_APP_NEW_BACKEND_API_URL}/workflows/external_request/${opportunity.rootStore.userStore.stateCode}/insert_tepe_contact_note`,
      body
    );
  };

  const onWriteButtonClick = () => {
    const contactNoteObj: Record<number, string[]> = Object.fromEntries(
      paginatedNote.map((page, index) => [Number(index + 1), page])
    );

    const contactNoteDateTime = new Date();
    const userId = opportunity.rootStore.workflowsStore.user?.info.id;

    // In non-production environments and requests by recidiviz users, the personExternalId and userId will be overriden in the backend.
    const contactNoteRequestBody = {
      personExternalId: person.externalId,
      userId,
      contactNote: contactNoteObj,
      contactNoteDateTime,
    };

    updateUsTnExpirationContactNoteSubmitted(
      opportunity,
      person.recordId,
      contactNoteObj,
      Timestamp.fromDate(contactNoteDateTime)
    );

    submitTEPEContactNote(contactNoteRequestBody);
  };

  const loading = (
    <div className="LoadingContainer">
      <Loading showMessage={false} />
      <ModalTitle>Submitting notes to TOMIS...</ModalTitle>
      <Disclaimer style={{ textAlign: "center" }}>
        This can take up to 30 seconds.
        <br />
        Do not refresh the page.
      </Disclaimer>
    </div>
  );

  const submissionForm = (
    <div className="SubmissionFormContainer">
      <ModalControls>
        <Button kind="link" onClick={onCloseFn}>
          <Icon kind="Close" size="14" color={palette.pine2} />
        </Button>
      </ModalControls>
      <ModalTitle>
        Review {paginatedNote.length} pages and submit TEPE note to eTomis
      </ModalTitle>
      <PreviewArea>
        <ClientName>{person.displayName}</ClientName>
        <ClientID>{person.externalId}</ClientID>
        {/* TODO(#2947): Add voters rights code */}
        <ContactTypes>Contact Types: TEPE</ContactTypes>
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
      <WriteButton kind="primary" shape="block" onClick={onWriteButtonClick}>
        Submit note to eTomis
      </WriteButton>
      <Disclaimer>
        {/* TODO(#2947): Make it sound less awkward for one page. */}
        This note has {paginatedNote.length} page(s). When you click submit, all{" "}
        {paginatedNote.length} page(s) will be submitted at once directly into
        eTomis as a contact note. Once submitted, you will only be able to make
        any further edits to these notes directly in eTomis.
      </Disclaimer>
    </div>
  );

  const getModalContent = () => {
    if (isNoteLoading) {
      return loading;
    }
    return submissionForm;
  };

  return (
    <StyledModal
      isOpen={showModal}
      onRequestClose={onCloseFn}
      className="WriteToTOMISModal"
      shouldCloseOnOverlayClick={false}
    >
      {getModalContent()}
    </StyledModal>
  );
});
