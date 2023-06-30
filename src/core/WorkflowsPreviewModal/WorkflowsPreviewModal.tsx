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
  DrawerModal,
  Icon,
  palette,
  spacing,
} from "@recidiviz/design-system";
import { rem } from "polished";
import React, { useEffect, useState } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";

export const StyledDrawerModal = styled(DrawerModal)<{
  isMobile: boolean;
}>`
  .ReactModal__Content {
    ${({ isMobile }) =>
      isMobile &&
      `max-width: unset !important;
    max-height: unset !important;
    width: 100% !important;
    height: 100% !important;
    right: 0 !important;
    border-radius: 0 !important;`}
  }
`;

const ModalControls = styled.div<{
  responsiveRevamp: boolean;
}>`
  ${({ responsiveRevamp }) =>
    responsiveRevamp
      ? `
        display: flex;
        flex-flow: column nowrap;
        justify-content: space-between;
        border-bottom: 1px solid ${palette.slate10};
        padding: 1rem;

        .WorkflowsPreviewModal__close {
          align-self: flex-end;
        };
      `
      : `padding: ${rem(spacing.md)};
          text-align: right;`}

  z-index: 10;
`;

const Wrapper = styled.div<{
  responsiveRevamp: boolean;
}>`
  padding: ${({ responsiveRevamp }) =>
    responsiveRevamp
      ? `${rem(spacing.lg)} ${rem(spacing.md)}`
      : `0 ${rem(spacing.lg)} ${rem(spacing.lg)}`};
`;

type PreviewModalProps = {
  isOpen: boolean;
  pageContent: JSX.Element;
  onAfterOpen?: () => void;
};

export function WorkflowsPreviewModal({
  isOpen,
  pageContent,
  onAfterOpen,
}: PreviewModalProps): JSX.Element {
  const {
    workflowsStore,
    workflowsStore: { featureVariants },
  } = useRootStore();
  const { isMobile } = useIsMobile(true);

  // Managing the modal isOpen state here instead of tying it directly to
  // props helps to smooth out the open/close transition
  const [modalIsOpen, setModalIsOpen] = useState(isOpen);
  useEffect(() => {
    setModalIsOpen(isOpen);
  }, [isOpen]);

  return (
    <StyledDrawerModal
      isOpen={modalIsOpen}
      onAfterOpen={onAfterOpen}
      onRequestClose={() => setModalIsOpen(false)}
      onAfterClose={() => workflowsStore.updateSelectedPerson(undefined)}
      closeTimeoutMS={1000}
      width={featureVariants.responsiveRevamp && !isMobile ? 480 : 555}
      isMobile={isMobile && !!featureVariants.responsiveRevamp}
    >
      <ModalControls responsiveRevamp={!!featureVariants.responsiveRevamp}>
        <Button
          className="WorkflowsPreviewModal__close"
          kind="link"
          onClick={() => {
            setModalIsOpen(false);
          }}
        >
          <Icon kind="Close" size="14" color={palette.pine2} />
        </Button>
      </ModalControls>
      <Wrapper
        className="WorkflowsPreviewModal"
        responsiveRevamp={!!featureVariants.responsiveRevamp}
      >
        {pageContent}
      </Wrapper>
    </StyledDrawerModal>
  );
}
