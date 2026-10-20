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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { ReactNode, useId } from "react";
import styled from "styled-components";

import { Icon, palette } from "~design-system";

import { DialogModal } from "../../DialogModal";

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
  padding: ${rem(spacing.lg)} ${rem(40)};
`;

const ModalTitle = styled.h2`
  ${typography.Sans16}
  color: ${palette.slate80};
  font-weight: 500;
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
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  padding: ${rem(spacing.xl)} ${rem(40)};
`;

/** Full text of a record whose card clips it to a few lines. */
export const ParoleRecordModalNarrative = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
  line-height: 1.6;
  white-space: pre-wrap;
`;

/**
 * The modal that opens the full text of a case profile record, such as a
 * disciplinary report or an offense.
 *
 * @param isOpen - Whether the modal shows.
 * @param title - Heading of the modal.
 * @param onRequestClose - Closes the modal.
 * @param children - Body of the modal. Pass nothing while no record is
 *   selected.
 */
export function ParoleRecordModal({
  isOpen,
  title,
  onRequestClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  onRequestClose: () => void;
  children?: ReactNode;
}) {
  const titleId = useId();
  return (
    <StyledDialogModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      aria={{ labelledby: titleId }}
    >
      <ModalHeader>
        <ModalTitle id={titleId}>{title}</ModalTitle>
        <CloseButton onClick={onRequestClose} aria-label="Close">
          <Icon kind="Close" size={20} />
        </CloseButton>
      </ModalHeader>
      {Boolean(children) && <ModalBody>{children}</ModalBody>}
    </StyledDialogModal>
  );
}
