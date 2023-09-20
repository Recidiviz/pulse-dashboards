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
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import useModalTimeoutDismissal from "./hooks/useModalTimeoutDismissal";
import WorkflowsPreviewModalContext from "./WorkflowsPreviewModalContext";

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
        display: grid;
        grid-template-columns: 1fr 1fr;
        justify-content: space-between;
        border-bottom: 1px solid ${palette.slate10};
        padding: 1rem;

        .WorkflowsPreviewModal__close {
          grid-column: 2;
          justify-self: flex-end;
        };

        .WorkflowsPreviewModal__back {
          grid-column 1;
          justify-self: flex-start;
        }
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

  hr + hr {
    display: none;
  }
`;

type PreviewModalProps = {
  isOpen: boolean;
  pageContent: JSX.Element;
  onAfterOpen?: () => void;
  onClose?: () => void;
  onBackClick?: () => void;
  clearSelectedPersonOnClose?: boolean;
};

export function WorkflowsPreviewModal({
  isOpen,
  pageContent,
  onAfterOpen,
  onBackClick,
  onClose = () => null,
  clearSelectedPersonOnClose = true,
}: PreviewModalProps): JSX.Element {
  const {
    workflowsStore,
    workflowsStore: { featureVariants },
  } = useRootStore();
  const { isMobile } = useIsMobile(true);
  const CLOSE_TIMEOUT_MS = 1000;
  const WIDTH_REVAMP = 480;
  const WIDTH_DEFAULT = 555;

  // Managing the modal isOpen state here instead of tying it directly to
  // props helps to smooth out the open/close transition
  const [modalIsOpen, setModalIsOpen] = useState(isOpen);
  const { setDismissAfterMs } = useModalTimeoutDismissal({ setModalIsOpen });

  useEffect(() => {
    setModalIsOpen(isOpen);
  }, [isOpen]);

  // useMemo here to prevent creating a new object on every render
  const contextValue = useMemo(
    () => ({ setDismissAfterMs, setModalIsOpen }),
    [setDismissAfterMs, setModalIsOpen]
  );

  function handleCloseModal() {
    onClose();
    setModalIsOpen(false);
  }

  return (
    <StyledDrawerModal
      isOpen={modalIsOpen}
      onAfterOpen={onAfterOpen}
      onRequestClose={() => handleCloseModal()}
      onAfterClose={() =>
        clearSelectedPersonOnClose &&
        workflowsStore.updateSelectedPerson(undefined)
      }
      closeTimeoutMS={CLOSE_TIMEOUT_MS}
      width={
        featureVariants.responsiveRevamp && !isMobile
          ? WIDTH_REVAMP
          : WIDTH_DEFAULT
      }
      isMobile={isMobile && !!featureVariants.responsiveRevamp}
    >
      <ModalControls responsiveRevamp={!!featureVariants.responsiveRevamp}>
        {onBackClick && (
          <Button
            className="WorkflowsPreviewModal__back"
            kind="link"
            onClick={onBackClick}
          >
            Back
          </Button>
        )}
        <Button
          className="WorkflowsPreviewModal__close"
          kind="link"
          onClick={() => handleCloseModal()}
        >
          <Icon kind="Close" size="14" color={palette.pine2} />
        </Button>
      </ModalControls>
      <WorkflowsPreviewModalContext.Provider value={contextValue}>
        <Wrapper
          className="WorkflowsPreviewModal"
          responsiveRevamp={!!featureVariants.responsiveRevamp}
        >
          {pageContent}
        </Wrapper>
      </WorkflowsPreviewModalContext.Provider>
    </StyledDrawerModal>
  );
}
