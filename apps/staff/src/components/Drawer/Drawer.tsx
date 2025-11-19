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

import "./Drawer.scss";

import cn from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useOnClickOutside from "use-onclickoutside";

import { Icon, IconSVG } from "~design-system";

type Props = {
  isShowing: boolean;
  hide: () => void;
  overlayStyles?: any;
  bodyStyles?: any;
  closeButton?: boolean;
  position?: "left" | "right" | "top" | "bottom";
  id?: string;
  children?: React.ReactNode;
};

const Drawer: React.FC<Props> = ({
  isShowing,
  overlayStyles,
  bodyStyles,
  hide,
  position = "left",
  closeButton = true,
  id,
  children,
}) => {
  const ref: any = useRef(undefined);
  useOnClickOutside(ref, hide);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isShowing ? "hidden" : "";

    if (isShowing) {
      setTimeout(() => setIsTransitioning(true), 0);
    } else if (!isShowing) {
      setTimeout(() => setIsTransitioning(false), 300);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isShowing]);

  useEffect(() => {
    if (!isShowing) {
      return;
    }
    const drawer = ref.current;

    // Get all focusable elements within the drawer
    const focusableElementsSelector =
      'menubar, button:not([tabindex="-1"]), [href]:not([tabindex="-1"]), input, select, [tabindex]:not([tabindex="-1"])';
    const focusableElements = drawer.querySelectorAll(
      focusableElementsSelector,
    );
    const firstFocusableElement = focusableElements?.[0];
    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }

    // Handle keyboard navigation for focus trapping
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hide();
        return;
      }

      // Handle Tab key for focus trapping
      if (event.key === "Tab") {
        if (!focusableElements || focusableElements.length === 0) {
          return;
        }

        const lastFocusableElement =
          focusableElements[focusableElements.length - 1];
        if (event.shiftKey) {
          // Shift + Tab: moving backwards
          if (
            document.activeElement === firstFocusableElement ||
            !drawer?.contains(document.activeElement)
          ) {
            event.stopPropagation();
            event.preventDefault();
            lastFocusableElement.focus();
          }
        } else {
          if (
            document.activeElement === lastFocusableElement ||
            (lastFocusableElement as HTMLElement)?.contains(
              document.activeElement as Node,
            ) ||
            !drawer?.contains(document.activeElement)
          ) {
            event.stopPropagation();
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
  }, [isShowing, hide, id]);

  if (!isTransitioning && !isShowing) {
    return null;
  }

  return createPortal(
    <div
      className={cn("Drawer", {
        Drawer__left: position === "left",
        Drawer__right: position === "right",
        Drawer__bottom: position === "bottom",
        Drawer__top: position === "top",
      })}
      id={id || "drawer"}
    >
      <div
        className={cn("Drawer__overlay", {
          "Drawer__overlay--open": isTransitioning && isShowing,
        })}
        style={overlayStyles}
      />
      <div
        className={cn("Drawer__wrapper", {
          "Drawer__wrapper--open": isTransitioning && isShowing,
        })}
        aria-hidden={isShowing ? "false" : "true"}
        aria-label="drawer"
        tabIndex={-1}
        role="dialog"
      >
        <div className="Drawer__body" style={bodyStyles} ref={ref}>
          {closeButton && (
            <Icon
              className="Drawer__close-icon"
              kind={position === "left" ? IconSVG.Arrow : IconSVG.Close}
              width={position === "left" ? 24 : 17}
              height={position === "left" ? 24 : 17}
              onClick={hide}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  hide();
                }
              }}
              tabIndex={0}
              aria-label="Close drawer"
            />
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Drawer;
