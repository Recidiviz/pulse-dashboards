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

import { Modal, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { JIIButton, SlateCopy } from "~@jii/common-ui";
import { spacing } from "~design-system";

interface RNAModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;

  title: string;
  message: string;
  cancelButtonText: string;
  confirmButtonText: string;
}

const ModalContents = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

const ModalTitle = styled.h2`
  ${typography.Sans24}
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${rem(spacing.md)};
  justify-content: flex-end;
`;

export const UsNcRNAModal = observer(function UsNcRNAModal({
  isOpen,
  onCancel,
  onConfirm,
  title,
  message,
  cancelButtonText,
  confirmButtonText,
}: RNAModalProps) {
  return (
    <Modal isOpen={isOpen} onRequestClose={onCancel}>
      <ModalContents>
        <ModalTitle>{title}</ModalTitle>
        <SlateCopy>{message}</SlateCopy>
        <ButtonGroup>
          <JIIButton kind="secondary" shape="pill" onClick={onCancel}>
            {cancelButtonText}
          </JIIButton>
          <JIIButton shape="pill" onClick={onConfirm}>
            {confirmButtonText}
          </JIIButton>
        </ButtonGroup>
      </ModalContents>
    </Modal>
  );
});
