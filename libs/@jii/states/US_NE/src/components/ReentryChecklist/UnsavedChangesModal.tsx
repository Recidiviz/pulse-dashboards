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

import { typography } from "@recidiviz/design-system";
import { darken, rem } from "polished";
import styled from "styled-components";

import { Button, palette, spacing } from "~design-system";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onDiscard: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: ${palette.white};
  border-radius: ${rem(12)};
  padding: ${rem(spacing.xl)};
  max-width: ${rem(480)};
  width: 90%;
  box-shadow: 0 ${rem(8)} ${rem(32)} rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  ${typography.Sans18}
  font-weight: 600;
  // color: ${palette.pine1};
  margin: 0 0 ${rem(spacing.md)} 0;
`;

const ModalMessage = styled.p`
  ${typography.Sans14}
  // color: ${palette.text.normal};
  margin: 0 0 ${rem(spacing.xl)} 0;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${rem(spacing.sm)};
  justify-content: flex-end;
`;

const DiscardButton = styled(Button)`
  border: none;
  background-color: ${palette.signal.error};
  color: ${palette.white};

  &:hover,
  &:focus-visible {
    background-color: ${darken(0.15, palette.signal.error)};
  }

  &:active {
    background-color: ${darken(0.25, palette.signal.error)};
  }
`;

export function UnsavedChangesModal({
  isOpen,
  onCancel,
  onDiscard,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <Overlay onClick={onCancel}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Unsaved Changes</ModalTitle>
        <ModalMessage>
          You have unsaved changes to your Roadmap to Re-entry. Are you sure
          want to discard them?
        </ModalMessage>
        <ButtonGroup>
          <Button kind="secondary" shape="pill" onClick={onCancel}>
            Cancel
          </Button>
          <DiscardButton shape="pill" onClick={onDiscard}>
            Discard
          </DiscardButton>
        </ButtonGroup>
      </ModalContainer>
    </Overlay>
  );
}
