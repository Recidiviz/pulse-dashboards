// Copyright (C) 2022 Recidiviz, Inc.
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
  palette,
} from "@recidiviz/design-system";
import { darken, rem } from "polished";
import * as React from "react";
import styled, { css } from "styled-components/macro";

import { DIMENSIONS_PX } from "../FormGenerator";
import type { FormViewerContextData } from "../FormViewer";
import FormCheckbox from "./FormCheckbox";
import FormInput from "./FormInput";

const EDIT_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG.Edit} color={palette.slate60} />
);

const Input = styled.input`
  border-width: 0;
  font-size: 9px;
  font-weight: normal;
  padding: 1px 3px;
  margin-bottom: 0;

  background-image: ${EDIT_BACKGROUND};
  background-repeat: no-repeat;
  background-position: left 3px center;
  background-size: 0.75em;
  padding-left: 1.5em;
`;

interface ItemProps {
  flex?: boolean;
  center?: boolean;
}

const Item = styled.div<ItemProps>(({ center, flex }) => {
  return `
    display: ${center ? "flex" : "initial"};
    align-items: ${center ? "center" : "initial"};
    justify-content: ${center ? "center" : "initial"};
    flex-direction: ${center ? "column" : "row"};
    flex: ${flex ? 1 : "initial"};
    padding: 0 2px;
    line-height: ${rem(12)};
    margin-bottom: 0;
  `;
});

interface GridProps {
  columns?: string;
  rows?: string;
}

const Grid = styled.div<GridProps>(
  ({ columns = "1fr", rows = "1fr" }) => `
    display: grid;
    grid-template-columns: ${columns};
    grid-template-rows: ${rows};
    align-items: stretch;
    grid-gap: 1px;
    // Extracted from TN form
    background: #a8a8a8;
    
    & > ${Item},
    & ${Input} {
      background-color: var(--grid-foreground-color);
    }

    label& {
      margin-bottom: 0;
    }
  `
);

const Emphasize = styled.span`
  font-style: italic;
`;

const PrintablePage = styled.div.attrs({ className: "form-page" })`
  background-color: white;
  height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  max-height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  overflow: hidden;
  color: black;
  font-family: Arial, serif;
  font-size: 9px;
  position: relative;

  line-height: 1.3;
`;

const FormContainer = styled.form<FormViewerContextData>`
  // Hide placeholders and blue background while printing
  ${({ isPrinting }) =>
    isPrinting
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

const PrintablePageMargin = styled.div`
  background-color: white;
  padding: ${rem(18)};
  box-sizing: content-box;
  transform-origin: 0 0;

  height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  max-height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  width: 100%;
`;

const HeaderRow = styled(Row)`
  background-color: #d9d9d9;
  align-items: center;
  font-weight: bold;
  padding: 0 9px;
  margin-top: 9px;
  margin-bottom: 0;
`;

const FormBox = styled.div`
  border: 1px solid black;

  > ${Grid}:nth-child(odd) > * {
    --grid-foreground-color: white;
  }

  > ${Grid}:nth-child(even) > * {
    --grid-foreground-color: #f2f2f2;
  }

  > ${Grid} {
    border-bottom: 1px solid #a8a8a8;
  }

  ${Grid} > label${Item} {
    white-space: nowrap;
  }
`;

const Checkbox = styled.input.attrs({
  type: "checkbox",
})`
  height: 9px;
  width: 9px;
  vertical-align: middle;
  margin: 0 0.25em 0 0;
`;

const SpecialConditionsCheckbox = styled(FormCheckbox)`
  margin-right: 0;
`;

const FormSignatureGrid = styled(Grid).attrs({
  columns: "2fr 1fr 2fr 1fr",
  rows: "18px 18px",
})`
  background-color: white;
  grid-gap: 5px;
  margin-top: 5px;
`;

const FormSignatureInput = styled(FormInput)`
  border-bottom: 1px solid black;
`;

export {
  Checkbox,
  Emphasize,
  FormBox,
  FormContainer,
  FormSignatureGrid,
  FormSignatureInput,
  Grid,
  HeaderRow,
  Input,
  Item,
  PrintablePage,
  PrintablePageMargin,
  Row,
  SpecialConditionsCheckbox,
};
