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

import { rem } from "polished";
import { ReactNode } from "react";
import styled from "styled-components";

import { DIMENSIONS_PX } from "./PDFFormGenerator";

type PrintablePageProps = {
  stretchable?: boolean;
  lineHeight?: number;
  landscape?: boolean;
  hidden?: boolean;
};

function pageHeight(landscape = false): string {
  if (landscape) {
    return rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN);
  }
  return rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN);
}

function pageWidth(landscape = false): string {
  if (landscape) {
    return rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN);
  }
  return rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN);
}

export const PrintablePageContainer = styled.div.attrs({
  className: "form-page",
})<PrintablePageProps>`
  display: ${(p) => (p.hidden ? "none" : "flex")};
  flex-direction: column;
  background-color: white;
  height: ${(p) => (p.stretchable ? undefined : pageHeight(p.landscape))};
  max-height: ${(p) => (p.stretchable ? undefined : pageHeight(p.landscape))};
  min-height: ${(p) => (p.stretchable ? pageHeight(p.landscape) : undefined)};
  width: ${(p) => pageWidth(p.landscape)};
  max-width: ${(p) => pageWidth(p.landscape)};
  overflow: hidden;
  color: black;
  font-family: Arial, serif;
  font-size: 9px;
  position: relative;

  line-height: ${({ lineHeight }) => lineHeight ?? 1.3};
`;

export const PrintablePageMargin = styled.div<
  Exclude<PrintablePageProps, "lineHeight">
>`
  background-color: white;
  padding: ${rem(18)};
  box-sizing: content-box;
  transform-origin: 0 0;

  height: ${(p) => (p.stretchable ? "none" : pageHeight(p.landscape))};
  max-height: ${(p) => (p.stretchable ? "none" : pageHeight(p.landscape))};
  min-height: ${(p) => (p.stretchable ? pageHeight(p.landscape) : "none")};
  width: ${(p) => pageWidth(p.landscape)};
  max-width: ${(p) => pageWidth(p.landscape)};
`;

export const PrintablePage = (
  props: PrintablePageProps & { children: ReactNode },
) => {
  return (
    <PrintablePageMargin {...props}>
      <PrintablePageContainer {...props}>
        {props.children}
      </PrintablePageContainer>
    </PrintablePageMargin>
  );
};
