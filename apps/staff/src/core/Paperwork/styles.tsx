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
import styled from "styled-components/macro";

import { DIMENSIONS_PX } from "./PDFFormGenerator";

type PrintablePageProps = {
  stretchable?: boolean;
};

export const PrintablePage = styled.div.attrs({
  className: "form-page",
})<PrintablePageProps>`
  display: flex;
  flex-direction: column;
  background-color: white;
  height: ${(p) =>
    p.stretchable
      ? undefined
      : rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  max-height: ${(p) =>
    p.stretchable
      ? undefined
      : rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  min-height: ${(p) =>
    p.stretchable
      ? rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)
      : undefined};
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  overflow: hidden;
  color: black;
  font-family: Arial, serif;
  font-size: 9px;
  position: relative;

  line-height: 1.3;
`;

export const PrintablePageMargin = styled.div<{ stretchable?: boolean }>`
  background-color: white;
  padding: ${rem(18)};
  box-sizing: content-box;
  transform-origin: 0 0;

  height: ${(p) =>
    p.stretchable ? "none" : rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  max-height: ${(p) =>
    p.stretchable ? "none" : rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  min-height: ${(p) =>
    p.stretchable ? rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN) : "none"};
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
`;
