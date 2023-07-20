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
import { animation } from "@recidiviz/design-system";
import { darken } from "polished";
import styled, { css } from "styled-components/macro";

import { FormViewerContextData } from "../../FormViewer";
import { Input as TnInput } from "../../US_TN/CompliantReporting/styles";

export const TextStyle = css`
  font-weight: 600;
  font-size: 5.8pt;
`;

export const NarrowFont = css`
  font-family: "Arial Narrow", Arial, sans-serif;
`;

export const TinyTextStyle = css`
  ${TextStyle};
  font-size: 4.5pt;
`;

export const SmallTextStyle = css`
  ${TextStyle};
  font-size: 5.6pt;
`;

export const MainLabelTextStyle = css`
  ${TextStyle};
  ${NarrowFont};
  font-size: 7.2pt;
`;

export const LargeTextStyle = css`
  ${TextStyle};
  font-size: 7.8pt;
`;

export const Border = css`
  border-color: black;
  border-style: solid;
`;

export const FormSection = styled.div`
  ${Border};
  border-width: 1px;

  display: flex;
  flex-direction: column;

  width: 100%;

  & > *:not(:last-child) {
    ${Border};
    border-width: 0 0 1px 0;
  }
`;

export const SectionRow = styled.div`
  width: 100%;
`;

export const SectionHeader = styled(SectionRow)`
  ${NarrowFont}
  ${LargeTextStyle}
  padding: 1px 0;
`;

export const SquareInputSelector = css`
  & label {
    margin-bottom: 0;
    display: flex;
  }

  & input[type="radio"],
  & input[type="checkbox"] {
    appearance: none;
    background-color: #fff;
    margin: 0 3px;
    font: inherit;
    color: black;
    width: 1em;
    height: 1em;
    border: 0.15em solid black;
    transform: translateY(0.175em);
    display: grid;
    place-content: center;

    &::before {
      content: "";
      width: 0.7em;
      height: 0.7em;
      transform: scale(0);
      transition: 120ms transform ease-in-out;
      box-shadow: inset 1em 1em black;
    }

    &:checked::before {
      transform: scale(1);
    }
  }
`;

export const Input = TnInput;

// TODO(#3564): [Workflows][Forms] Generalize FormContainer
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
