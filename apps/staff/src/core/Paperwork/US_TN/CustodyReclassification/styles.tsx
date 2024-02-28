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
// TODO(#4108): Consider and apply refactoring `UsTnAnnualReclassificationReview...` and `UsTnCustodyLevelDowngrade...` files to remove duplicated logic.
import {
  animation,
  Icon,
  IconSVG,
  iconToDataURI,
  palette,
} from "@recidiviz/design-system";
import { darken } from "polished";
import React from "react";
import styled, { css } from "styled-components/macro";

import type { FormViewerContextData } from "../../FormViewer";

const EDIT_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG.Edit} color={palette.slate60} />,
);

export const Label = styled.label`
  display: flex;
  align-items: baseline;
`;

export const Input = styled.input`
  border-width: 0;
  font-size: 9px;
  font-weight: normal;
  padding: 1px 3px;
  margin-bottom: 0;
`;

export const RadioButton = styled.input.attrs({
  type: "radio",
})`
  display: inline-block;
  vertical-align: top;
  margin-right: 0.5em;
`;

const LeaderContainer = styled.div`
  overflow: hidden;
  flex-grow: 1;

  &:after {
    float: left;
    width: 0;
    white-space: nowrap;
    content: "${".".repeat(200)}";
  }
  span {
    background: white;
    padding-right: 0.2em;
  }
`;

export const TextWithLeader: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => (
  <LeaderContainer>
    <span>{children}</span>
  </LeaderContainer>
);

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
          ${RadioButton} {
            display: none;
          }
        `
      : css`
        ${Input}, textarea {
            background-image: ${EDIT_BACKGROUND};
            background-repeat: no-repeat;
            background-position: top 4px left 3px;
            background-size: 0.75em;
            padding-left: 1.5em;

            background-color: aliceblue;
            transition-duration: ${animation.defaultDurationMs}ms;
            transition-property: background-color;
            &:hover {
              background-color: ${darken(0.1, "aliceblue")};
            }
        `}
`;
