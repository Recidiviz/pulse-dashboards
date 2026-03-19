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

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import useOnClickOutside from "use-onclickoutside";

import { Icon, IconSVG, palette, typography } from "~design-system";

const MOBILE_BREAKPOINT = 768;
const PANEL_WIDTH = 520;
const TRANSITION_DURATION_MS = 300;

const Overlay = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100vw;
  height: 100vh;
  background: ${palette.slate30};
  backdrop-filter: blur(4px);
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transition: opacity ${TRANSITION_DURATION_MS}ms ease;
`;

const Wrapper = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 500;
  width: 100%;
  height: 100%;
  clip-path: inset(0);
  outline: 0;
`;

const Body = styled.div<{ $isVisible: boolean }>`
  display: flex;
  flex-direction: column;
  z-index: 99;
  position: relative;
  background: ${({ theme }) => theme.modal.backgroundColor};
  box-shadow: -4px 0 35px rgba(0, 0, 0, 0.15);
  border-radius: 0.5rem 0 0 0.5rem;
  width: ${PANEL_WIDTH}px;
  transform: translateX(${({ $isVisible }) => ($isVisible ? "0" : "100%")});
  transition: transform ${TRANSITION_DURATION_MS}ms ease;

  @media screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    width: 100%;
    border-radius: 0;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: ${({ theme }) => theme.modal.headerFontFamily};
  font-size: ${({ theme }) => theme.modal.headerFontSize};
  font-weight: ${({ theme }) => theme.modal.headerFontWeight};
  line-height: 1.2;
  color: ${({ theme }) => theme.modal.headerColor};
  padding: 3rem 2.5rem 1rem;

  @media screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    padding: 2rem 1rem 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${({ theme }) => theme.modal.closeButtonColor};
  margin-left: auto;
  outline: none;

  &:focus-visible {
    color: ${({ theme }) => theme.modal.closeFocusColor};
    outline: 2px solid ${({ theme }) => theme.modal.closeFocusColor};
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const ModalContent = styled.div`
  overflow-y: auto;
  padding: 1.5rem 2.5rem;
  height: 100%;
  ${typography.Sans14}

  @media screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    padding: 1.5rem 1rem;
  }
`;

const ModalFooter = styled.div`
  margin-top: auto;
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid ${({ theme }) => theme.modal.footerBorderColor};
  padding: 1.5rem 2.5rem;

  & button {
    ${typography.Sans16}
    display: block;
  }

  @media screen and (max-width: ${MOBILE_BREAKPOINT}px) {
    padding: 1.5rem 1rem;
  }
`;

type PathwaysModalProps = {
  isShowing: boolean;
  hide: () => void;
  title?: string;
  footer?: React.ReactElement;
  children?: React.ReactNode;
};

const PathwaysModal: React.FC<PathwaysModalProps> = ({
  isShowing,
  hide,
  title,
  footer,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useOnClickOutside(ref as React.RefObject<HTMLElement>, () => {
    if (isVisible) hide();
  });

  useEffect(() => {
    if (isShowing) {
      setIsMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      return;
    }

    setIsVisible(false);
    const timeout = setTimeout(
      () => setIsMounted(false),
      TRANSITION_DURATION_MS,
    );
    return () => clearTimeout(timeout);
  }, [isShowing]);

  useEffect(() => {
    document.body.style.overflow = isMounted ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isShowing) {
      return;
    }

    const modalElement = ref.current;
    if (!modalElement) return;

    const focusableElementsSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(
      modalElement.querySelectorAll(focusableElementsSelector),
    ) as HTMLElement[];

    if (focusableElements.length === 0) return;

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement =
      focusableElements[focusableElements.length - 1];

    firstFocusableElement.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hide();
        return;
      }

      if (event.key === "Tab") {
        if (event.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            event.preventDefault();
            lastFocusableElement.focus();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            event.preventDefault();
            firstFocusableElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isShowing, isMounted, hide]);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div>
      <Overlay $isVisible={isVisible} />
      <Wrapper aria-modal="true" aria-label={title || "Modal"} role="dialog">
        <Body $isVisible={isVisible} ref={ref}>
          <Header>
            {title}
            <CloseButton onClick={hide} aria-label="Close modal">
              <Icon kind={IconSVG["Close"]} width={14} height={14} />
            </CloseButton>
          </Header>
          <ModalContent>{children}</ModalContent>
          {footer && <ModalFooter>{footer}</ModalFooter>}
        </Body>
      </Wrapper>
    </div>,
    document.body,
  );
};

export default PathwaysModal;
