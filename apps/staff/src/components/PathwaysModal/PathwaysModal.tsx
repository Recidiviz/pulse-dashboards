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

import "./PathwaysModal.scss";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useOnClickOutside from "use-onclickoutside";

import { Icon, IconSVG } from "~design-system";

type Props = {
  isShowing: boolean;
  hide: () => void;
  title?: string;
  footer?: React.ReactElement<any>;
  backgroundColor?: string;
  children?: React.ReactNode;
};

const PathwaysModal: React.FC<Props> = ({
  isShowing,
  hide,
  title,
  footer,
  backgroundColor,
  children,
}) => {
  const ref: any = useRef(undefined);
  useOnClickOutside(ref, hide);

  useEffect(() => {
    document.body.style.overflow = isShowing ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isShowing]);

  useEffect(() => {
    if (!isShowing) {
      return;
    }

    const modalElement = ref.current;
    if (!modalElement) return;

    // --- Focus Trapping Logic ---
    const focusableElementsSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(
      modalElement.querySelectorAll(focusableElementsSelector),
    ) as HTMLElement[];

    if (focusableElements.length === 0) return;

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement =
      focusableElements[focusableElements.length - 1];

    // 1. Set initial focus on the first element
    firstFocusableElement.focus();

    // Define the handler as a stable function
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hide();
        return;
      }

      if (event.key === "Tab") {
        // If shift + tab is pressed
        if (event.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            event.preventDefault();
            lastFocusableElement.focus();
          }
        } else {
          // If tab is pressed
          if (document.activeElement === lastFocusableElement) {
            event.preventDefault();
            firstFocusableElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Cleanup: remove the event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isShowing, hide]);

  if (!isShowing) {
    return null;
  }

  return createPortal(
    <div className="Modal" id="more-filters-modal">
      <div className="Modal__overlay" />
      <div
        className="Modal__wrapper"
        aria-modal="true"
        aria-label="Modal"
        role="dialog"
      >
        <div
          className="Modal__body"
          style={{ background: backgroundColor }}
          ref={ref}
        >
          <div className="Modal__header">
            {title}
            <Icon
              className="Modal__close-icon"
              kind={IconSVG.Close}
              width={14}
              height={14}
              onClick={hide}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.code === "Enter") {
                  e.preventDefault();
                  hide();
                }
              }}
              tabIndex={0}
              aria-label="Close modal"
            />
          </div>
          <div className="Modal__content">{children}</div>
          {footer && <div className="Modal__footer">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PathwaysModal;
