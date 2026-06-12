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

import { rem } from "polished";
import styled from "styled-components";

import { Icon, palette, typography } from "~design-system";

import { formatWorkflowsDate } from "../../../../utils";
import { DialogModal } from "../../../DialogModal";
import { RecentCaseNote } from "./useRecentCaseNotes";

/**
 * Detail modal for a single recent case note. Wraps the repo's `DialogModal`
 * primitive — adjusting width + padding to match Figma node 7615-2763 — and
 * renders the source label, date, and full body text. Closing the modal is
 * handled by `onRequestClose` (backdrop click, ESC, and the explicit X button
 * all funnel through it).
 */

const StyledDialogModal = styled(DialogModal)`
  .ReactModal__Content {
    max-width: 90vw;
    padding: 0;
    width: ${rem(768)};
  }
`;

const ModalHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${palette.slate20};
  display: flex;
  justify-content: space-between;
  padding: ${rem(24)} ${rem(40)};
`;

const ModalTitle = styled.h2`
  ${typography.Sans16}
  color: ${palette.slate80};
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 0;
`;

const CloseButton = styled.button.attrs({ type: "button" })`
  align-items: center;
  background: transparent;
  border: 0;
  color: ${palette.slate60};
  cursor: pointer;
  display: flex;
  padding: 0;
`;

const ModalBody = styled.div`
  padding: ${rem(32)} ${rem(40)};
`;

const NoteMetaRow = styled.div`
  align-items: baseline;
  display: flex;
  justify-content: space-between;
  margin-bottom: ${rem(24)};
`;

const NoteSource = styled.span`
  ${typography.Sans14}
  color: ${palette.slate60};
  font-weight: 500;
`;

const NoteDate = styled.span`
  ${typography.Sans12}
  color: ${palette.slate60};
`;

const NoteBody = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
  font-weight: 500;
  line-height: 1.6;
  white-space: pre-wrap;
`;

type Props = {
  isOpen: boolean;
  note: RecentCaseNote | undefined;
  onRequestClose: () => void;
};

export function RecentCaseNoteModal({ isOpen, note, onRequestClose }: Props) {
  return (
    <StyledDialogModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      aria={{ labelledby: "recent-case-note-modal-title" }}
    >
      <ModalHeader>
        <ModalTitle id="recent-case-note-modal-title">Case Note</ModalTitle>
        <CloseButton onClick={onRequestClose} aria-label="Close">
          <Icon kind="Close" size={20} />
        </CloseButton>
      </ModalHeader>
      {note && (
        <ModalBody>
          <NoteMetaRow>
            <NoteSource>{note.source}</NoteSource>
            <NoteDate>{formatWorkflowsDate(note.date)}</NoteDate>
          </NoteMetaRow>
          <NoteBody>{note.body}</NoteBody>
        </ModalBody>
      )}
    </StyledDialogModal>
  );
}
