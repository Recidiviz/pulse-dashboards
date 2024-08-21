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

import "./Modal.scss";

import { Icon, IconSVG } from "@recidiviz/design-system";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useOnClickOutside from "use-onclickoutside";

type Props = {
  isShowing: boolean;
  hide: () => void;
  title?: string;
  footer?: React.ReactElement;
  backgroundColor?: string;
  children?: React.ReactNode;
};

const Modal: React.FC<Props> = ({
  isShowing,
  hide,
  title,
  footer,
  backgroundColor,
  children,
}) => {
  const ref: any = useRef();
  useOnClickOutside(ref, hide);

  useEffect(() => {
    document.body.style.overflow = isShowing ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isShowing]);

  if (!isShowing) {
    return null;
  }

  return createPortal(
    <div className="Modal">
      <div className="Modal__overlay" />
      <div
        className="Modal__wrapper"
        aria-modal
        aria-hidden
        aria-label="Modal"
        tabIndex={-1}
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

export default Modal;
