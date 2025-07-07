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
import {
  animation,
  Icon,
  IconSVG,
  iconToDataURI,
} from "@recidiviz/design-system";
import { darken, rem } from "polished";
import styled, { css } from "styled-components/macro";

import { palette } from "~design-system";

import type { FormViewerContextData } from "../FormViewer";

const EDIT_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG.Edit} color={palette.slate60} />,
);

export const Input = styled.input`
  border-width: 0;
  font-size: 8px;
  font-weight: normal;
  padding: 1px 3px;
  margin-bottom: 0;

  background-image: ${EDIT_BACKGROUND};
  background-repeat: no-repeat;
  background-position: left 3px center;
  background-size: 0.75em;
  padding-left: 1.5em;
`;

export const FormContainer = styled.form<FormViewerContextData>`
  // Hide placeholders and blue background while downloading
  ${({ isDownloading }) =>
    isDownloading
      ? css`
          // :placeholder-shown is a hack for modifying placeholder styles in html2canvas
          ${Input}:placeholder-shown,
          ${Input}::placeholder {
            color: transparent;
          }
          // MS EDGE renders borders despite there being none. Override to transparent/0 width
          ${Input} {
            border-width: 0;
            border-color: transparent;
            padding-left: 1px;
            background-image: none;
          }
        `
      : css`
          ${Input} {
            background-color: aliceblue;
            transition-duration: ${animation.defaultDurationMs}ms;
            transition-property: background-color;
            &:hover {
              background-color: ${darken(0.1, "aliceblue")};
            }
        `}
`;

interface ItemProps {
  flex?: boolean;
  center?: boolean;
  width?: number;
  textAlignCenter?: boolean;
}

export const Item = styled.div<ItemProps>(
  ({ center, flex, width, textAlignCenter }) => {
    return `
    display: ${center ? "flex" : "initial"};
    align-items: ${center ? "center" : "initial"};
    justify-content: start;
    flex-direction: ${center ? "column" : "row"};
    flex: ${flex ? 1 : "initial"};
    padding: 0 2px;
    line-height: ${rem(12)};
    margin-bottom: 0;
    width: ${width ? rem(width) : "initial"};
    text-align: ${textAlignCenter ? "center" : "initial"};
  `;
  },
);

export const ErsItem = styled(Item)`
  line-height: unset;
`;

interface RowProps {
  paddingLeft?: boolean;
  justifyContentStart?: boolean;
  unsetMargin?: boolean;
}

export const Row = styled.div<RowProps>(
  ({ paddingLeft, justifyContentStart, unsetMargin }) => {
    return `
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: ${justifyContentStart ? "start" : "space-between"};
    margin-bottom: ${unsetMargin ? "unset" : "4px"};
    width: 100%;
    padding-left: ${paddingLeft ? "60px" : "0pt"};
  `;
  },
);

export const Checkbox = styled.input.attrs({
  type: "checkbox",
})`
  height: 15px;
`;

interface GridProps {
  columns?: string;
  rows?: string;
}

export const Grid = styled.div<GridProps>(
  ({ columns = "1fr", rows = "1fr" }) => `
    font-size: 8px;
    display: grid;
    grid-template-columns: ${columns};
    grid-template-rows: ${rows};
    align-items: stretch;
    grid-gap: 1px;
    border-top: 1px solid;
    border-left: 1px solid;
    
    & > ${Item},
    & ${Input} {
      border-right: 1px solid;  
    }
  `,
);
