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
  Modal,
  palette,
  Sans14,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components/macro";

import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import {
  PagePreviewWithHover,
  SmallPagePreviewWithHover,
} from "../controls/WorkflowsNotePreview";

const TOMIS_FONT_FAMILY = "Verdana, sans-serif";

const StyledModal = styled(Modal)`
  .ReactModal__Content {
    padding: 0;
    max-width: 85vw;
    width: ${rem(740)};
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
  paginatedNote: string[];
  person: JusticeInvolvedPerson;
};

export const WriteToTOMISModal = observer(function WriteToTOMISModal({
  showModal,
  onCloseFn,
  paginatedNote,
  person,
}: writeToTOMISModalProps) {
  const [pageNumberSelected, setPageNumberSelected] = useState(0);
  return (
    <StyledModal
      isOpen={showModal}
      onRequestClose={onCloseFn}
      className="WriteToTOMISModal"
    >
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
        <PagePreviewWithHover className="TEPEPagePreview">
          {paginatedNote[pageNumberSelected]}
        </PagePreviewWithHover>
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
              {page}
            </SmallPagePreviewWithHover>
          ))}
        </PagesContainer>
      </PreviewArea>
      <WriteButton
        kind="primary"
        shape="block"
        // TODO(#2920): Actually do stuff when the button is clicked.
      >
        Submit note to eTomis
      </WriteButton>
      <Disclaimer>
        {/* TODO(#2947): Make it sound less awkward for one page. */}
        This note has {paginatedNote.length} page(s). When you click submit, all{" "}
        {paginatedNote.length} page(s) will be submitted at once directly into
        eTomis as a contact note. Once submitted, you will only be able to make
        any further edits to these notes directly in eTomis.
      </Disclaimer>
    </StyledModal>
  );
});
