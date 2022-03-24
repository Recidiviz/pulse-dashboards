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
import { rem } from "polished";
import styled, { css } from "styled-components/macro";

import { FORMAT_HEIGHT, FORMAT_WIDTH, MARGIN } from "../FormGenerator";
import { FormViewerContextData } from "../FormViewer";

const Input = styled.input.attrs({ type: "text" })`
  border-width: 0;
  font-size: 9px;
  font-weight: normal;
  padding: 1px 3px;
  margin-bottom: 0;
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
  `
);

const Emphasize = styled.span`
  font-style: italic;
`;

const PrintablePage = styled.div.attrs({ className: "form-page" })`
  background-color: white;
  height: ${rem(FORMAT_HEIGHT - MARGIN)};
  max-height: ${rem(FORMAT_HEIGHT - MARGIN)};
  width: ${rem(FORMAT_WIDTH - MARGIN)};
  max-width: ${rem(FORMAT_WIDTH - MARGIN)};
  overflow: hidden;
  color: black;
  font-family: Arial, serif;
  font-size: 9px;
  position: relative;

  line-height: 1.3;
`;

const FormContainer = styled.div<FormViewerContextData>`
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
          }
        `
      : css`
          ${Input} {
            background: aliceblue;
          }
        `}
`;

const PrintablePageMargin = styled.div`
  background-color: white;
  padding: ${rem(18)};
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

const SpecialConditionsCheckbox = styled(Checkbox)`
  margin-right: 0;
`;

export {
  Checkbox,
  Emphasize,
  FormBox,
  FormContainer,
  Grid,
  HeaderRow,
  Input,
  Item,
  PrintablePage,
  PrintablePageMargin,
  Row,
  SpecialConditionsCheckbox,
};
