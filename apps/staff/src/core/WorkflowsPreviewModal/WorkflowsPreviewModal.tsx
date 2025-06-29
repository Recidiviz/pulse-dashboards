// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Button, DrawerModal, Icon, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { NAV_BAR_HEIGHT } from "../NavigationLayout";
import { FOOTER_HEIGHT } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfileFooter";
import useModalTimeoutDismissal from "./hooks/useModalTimeoutDismissal";
import WorkflowsPreviewModalContext from "./WorkflowsPreviewModalContext";

const StyledDrawerModal = styled(DrawerModal)<{
  isMobile: boolean;
  $overrideStyles: boolean;
}>`
  ${({ $overrideStyles, isMobile }) =>
    $overrideStyles
      ? `.ReactModal__Overlay {
    width: 0 !important;
    backdrop-filter: unset;
    // Stop the preview modal from being given a higher z-index than the nav bar,
    // which would block dropdown menus from the top bar
    z-index: unset !important;
  }

  .ReactModal__Content {
    border-radius: unset;
    box-shadow: unset;
    border: 1px solid ${palette.slate20};
    right: 0 !important;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    
    ${
      isMobile
        ? `
    max-width: unset !important;
    max-height: unset !important;
    width: 100% !important;
    height: 100% !important;

    // add padding to the bottom of the modal to account for the footer
    padding-bottom: ${rem(NAV_BAR_HEIGHT - 1)} !important;
    `
        : `
    height: calc(100vh - ${rem(NAV_BAR_HEIGHT)}) !important;
    min-height: unset;
    // the DrawerModal is translated in the y-direction by -50% of its own height;
    // to align the top of the modal with the bottom of the nav bar, we account for
    // this offset, the nav bar, and the 1px border
    top: calc(
      0.5 * (100vh - ${rem(NAV_BAR_HEIGHT)}) + ${rem(NAV_BAR_HEIGHT - 1)}
    ) !important;
    `
    }
    
}`
      : `.ReactModal__Content {
    display: flex;
    flex-direction: column;

    ${
      isMobile &&
      `max-width: unset !important;
    max-height: unset !important;
    width: 100% !important;
    height: 100% !important;
    right: 0 !important;
    border-radius: 0 !important;
    // add padding to the bottom of the modal to account for the footer
    padding-bottom: 63px; !important;
    `
    }
  }`}
`;

const ModalControls = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-content: space-between;
  border-bottom: 1px solid ${palette.slate10};
  background: white;
  padding: 1rem;

  .WorkflowsPreviewModal__close {
    grid-column: 2;
    justify-self: flex-end;
  }

  .WorkflowsPreviewModal__back {
    grid-column: 1;
    justify-self: flex-start;
  }
`;

const Wrapper = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};
  flex: 1; // expand as much as possible, which pushes the footer down

  hr + hr {
    display: none;
  }
  max-height: calc(100% - ${FOOTER_HEIGHT}px);
  overflow-y: auto;
`;

const Footer = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
`;

type PreviewModalProps = {
  isOpen: boolean;
  pageContent: JSX.Element;
  footerContent?: JSX.Element;
  onAfterOpen?: () => void;
  onClose?: () => void;
  onBackClick?: () => void;
  clearSelectedPersonOnClose?: boolean;
  contentRef?: React.MutableRefObject<HTMLDivElement | null>;
};

export function WorkflowsPreviewModal({
  isOpen,
  pageContent,
  footerContent,
  onAfterOpen,
  onBackClick,
  onClose = () => null,
  clearSelectedPersonOnClose = true,
  contentRef,
}: PreviewModalProps): JSX.Element {
  const { workflowsStore } = useRootStore();
  const { isMobile } = useIsMobile(true);
  const CLOSE_TIMEOUT_MS = 1000;
  const MODAL_WIDTH = 480;

  // Managing the modal isOpen state here instead of tying it directly to
  // props helps to smooth out the open/close transition
  const [modalIsOpen, setModalIsOpen] = useState(isOpen);
  const { setDismissAfterMs } = useModalTimeoutDismissal({ setModalIsOpen });

  // Scroll to the top when a new modal is opened
  useEffect(() => {
    if (contentRef?.current) {
      contentRef.current.scrollTo(0, 0);
    }
  }, [workflowsStore.selectedOpportunity, contentRef]);

  useEffect(() => {
    setModalIsOpen(isOpen);
  }, [isOpen]);

  // useMemo here to prevent creating a new object on every render
  const contextValue = useMemo(
    () => ({ setDismissAfterMs, setModalIsOpen }),
    [setDismissAfterMs, setModalIsOpen],
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
      onAfterClose={async () => {
        if (clearSelectedPersonOnClose) {
          await workflowsStore.updateSelectedPersonAndOpportunity(undefined);
        }
      }}
      closeTimeoutMS={CLOSE_TIMEOUT_MS}
      width={MODAL_WIDTH}
      isMobile={isMobile}
      contentRef={(node) => {
        if (contentRef) {
          contentRef.current = node;
        }
      }}
      shouldCloseOnOverlayClick={false}
      $overrideStyles={true}
      disableBackgroundScroll={isMobile}
    >
      <ModalControls>
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
        <Wrapper className="WorkflowsPreviewModal">{pageContent}</Wrapper>
      </WorkflowsPreviewModalContext.Provider>
      {footerContent && <Footer>{footerContent}</Footer>}
    </StyledDrawerModal>
  );
}
