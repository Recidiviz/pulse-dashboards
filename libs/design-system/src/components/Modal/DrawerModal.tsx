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
import styled from "styled-components";

import { Card } from "../Card";
import { Modal } from "./Modal";

const UnpaddedModal = styled(Modal)`
  /* need extra specificity to override base */
  && .ReactModal__Content {
    padding: 0;
  }

  ${Card} {
    box-shadow: none;
  }
`;

const DEFAULT_DRAWER_MARGIN = 24;
const DEFAULT_DRAWER_WIDTH = 555;

/**
 * This component inherits from the **Modal** component
 * which itself is a wrapper around the
 * [React Modal]({https://www.npmjs.com/package/react-modal) package.
 *
 * It will dim and blur the page behind it while open, and prevent the page from scrolling
 * using the [Body Scroll Lock](https://www.npmjs.com/package/body-scroll-lock) package.
 *
 * The `width` can be adjusted manually by providing a `number`. If not set explicitly, it
 * will default to a (responsive) width of `555`px.
 *
 * The `isOpen` prop controls modal visibility, and the `onRequestClose`
 * prop is a hook that should set `isOpen` to `false`.
 */
export const DrawerModal = styled(UnpaddedModal)<{ width?: number }>`
  /* need extra specificity to override base */
  && .ReactModal__Content {
    height: calc(100vh - ${rem(DEFAULT_DRAWER_MARGIN * 2)});
    max-height: unset;
    max-width: calc(100vw - ${rem(DEFAULT_DRAWER_MARGIN * 2)});
    width: ${(props) => rem(props.width || DEFAULT_DRAWER_WIDTH)};

    /* transition: slide out from side instead of zooming from center */
    left: unset;
    right: ${rem(DEFAULT_DRAWER_MARGIN)};
    transform: translate(
      ${(props) => rem(props.width || DEFAULT_DRAWER_WIDTH)},
      -50%
    ) !important;

    &.ReactModal__Content--after-open {
      transform: translate(0, -50%) !important;
    }

    &.ReactModal__Content--before-close {
      transform: translate(
        ${(props) => rem(props.width || DEFAULT_DRAWER_WIDTH)},
        -50%
      ) !important;
    }
  }
`;
