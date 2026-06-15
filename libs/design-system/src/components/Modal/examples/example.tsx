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

import { spacing } from "../../../styles";
import { Button } from "../../Button";
import { DrawerModal } from "../DrawerModal";
import { Modal, ModalHeading } from "../Modal";

const Header = styled.div`
  align-items: center;
  display: flex;
  gap: ${rem(spacing.md)};
  justify-content: space-between;
  margin-bottom: ${rem(spacing.lg)};
`;

export type ModalExampleArgs = {
  contentLabel?: string;
  disableBackgroundScroll: boolean;
  withHeading: boolean;
  asDrawer: boolean;
  width?: number;
};

export default function ModalExample({
  contentLabel,
  disableBackgroundScroll,
  withHeading,
  asDrawer,
  width,
}: ModalExampleArgs) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  useEffect(() => {
    ReactModal.setAppElement(
      document.getElementById("storybook-root") ?? document.body,
    );
  }, []);

  const body = (
    <>
      <Header>
        {withHeading ? <ModalHeading>Heading</ModalHeading> : <span />}
        <Button
          kind="borderless"
          icon="Close"
          iconSize={12}
          onClick={close}
          aria-label="Close"
        />
      </Header>
      <p>The quick brown fox jumps over the lazy dog.</p>
    </>
  );

  return (
    <div style={{ padding: 24 }}>
      <Button kind="primary" onClick={() => setIsOpen(true)}>
        Open modal
      </Button>
      {asDrawer ? (
        <DrawerModal
          isOpen={isOpen}
          onRequestClose={close}
          contentLabel={contentLabel}
          disableBackgroundScroll={disableBackgroundScroll}
          width={width}
        >
          <div style={{ padding: rem(spacing.xl) }}>{body}</div>
        </DrawerModal>
      ) : (
        <Modal
          isOpen={isOpen}
          onRequestClose={close}
          contentLabel={contentLabel}
          disableBackgroundScroll={disableBackgroundScroll}
        >
          {body}
        </Modal>
      )}
    </div>
  );
}
