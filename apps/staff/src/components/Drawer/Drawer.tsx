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

import { Icon, IconSVG } from "@recidiviz/design-system";
import cn from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useOnClickOutside from "use-onclickoutside";

type Props = {
  isShowing: boolean;
  hide: () => void;
  overlayStyles?: any;
  bodyStyles?: any;
  closeButton?: boolean;
  position?: "left" | "right" | "top" | "bottom";
  children?: React.ReactNode;
};

const Drawer: React.FC<Props> = ({
  isShowing,
  overlayStyles,
  bodyStyles,
  hide,
  position = "left",
  closeButton = true,
  children,
}) => {
  const ref: any = useRef();
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
