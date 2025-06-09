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

import { Button, Modal, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { createPortal } from "react-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

const ModalHeader = styled.div`
  ${typography.Sans18};
  color: ${palette.pine1};
  margin-bottom: 18px;
`;

const ModalDescription = styled.div`
  ${typography.Sans14};
  color: ${palette.pine4};
  margin-bottom: ${rem(spacing.lg)};
`;

const ActionButtonWrapper = styled.div`
  display: flex;
  gap: ${rem(spacing.sm)};
`;

const ModalButton = styled(Button)`
  padding: 14px ${rem(spacing.md)};
`;

export const RevertChangesConfirmationModal: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
  headerText: string;
  descriptionText: string;
}> = ({ onConfirm, onCancel, headerText, descriptionText }) => {
  return createPortal(
    <Modal isOpen={true}>
      <ModalHeader>{headerText}</ModalHeader>
      <ModalDescription>{descriptionText}</ModalDescription>
      <ActionButtonWrapper>
        <ModalButton kind="secondary" shape="block" onClick={onCancel}>
          Cancel
        </ModalButton>
        <ModalButton shape="block" onClick={onConfirm}>
          Revert Changes
        </ModalButton>
      </ActionButtonWrapper>
    </Modal>,
    document.body,
  );
};
