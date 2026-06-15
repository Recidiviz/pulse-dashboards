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
import { useEffect, useState } from "react";
import ReactModal from "react-modal";
import styled from "styled-components";

import { palette, spacing, typography } from "../../../styles";
import { Button } from "../../Button";
import { Modal, ModalHeading } from "../Modal";

const ActionRow = styled.div`
  display: flex;
  gap: ${rem(spacing.sm)};
  justify-content: flex-end;
  margin-top: ${rem(spacing.lg)};
`;

const Description = styled.p`
  ${typography.Sans14}
  color: ${palette.slate80};
  margin: 0 0 ${rem(spacing.md)};
`;

export type ConfirmationModalExampleArgs = {
  contentLabel?: string;
};

export default function ConfirmationModalExample({
  contentLabel,
}: ConfirmationModalExampleArgs) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  useEffect(() => {
    ReactModal.setAppElement(
      document.getElementById("storybook-root") ?? document.body,
    );
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Button kind="secondary" onClick={() => setIsOpen(true)}>
        Discard changes
      </Button>
      <Modal isOpen={isOpen} onRequestClose={close} contentLabel={contentLabel}>
        <ModalHeading>Are you sure?</ModalHeading>
        <Description>
          The quick brown fox jumps over the lazy dog. This action cannot be
          undone.
        </Description>
        <ActionRow>
          <Button kind="secondary" onClick={close}>
            Cancel
          </Button>
          <Button kind="primary" onClick={close}>
            Confirm
          </Button>
        </ActionRow>
      </Modal>
    </div>
  );
}
