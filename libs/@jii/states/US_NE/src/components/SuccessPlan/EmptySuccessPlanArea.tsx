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

import { CopyWrapper, SlateCopy } from "~@jii/common-ui";
import { palette, spacing } from "~design-system";

const DashedBorderArea = styled.div`
  position: relative;
  padding: ${rem(spacing.lg)};
`;

// TODO(OBT-56706): this is taken from the sentence-dates library, extract to a common-ui component
const DashedBorderSvg = styled.svg`
  position: absolute;
  top: 0px;
  left: 0px;
  height: 100%;
  width: 100%;
  pointer-events: none;
  // makes sure the rect border doesn't get clipped
  overflow: visible;

  rect {
    fill: none;
    stroke: ${palette.slate20};
    stroke-width: ${rem(1)};
    stroke-dasharray: 8, 4;
    rx: ${rem(8)};
    ry: ${rem(8)};
    width: 100%;
    height: 100%;
  }
`;

const EmptyAreaHeading = styled(CopyWrapper)`
  margin-bottom: ${rem(spacing.xs)};
  p {
    margin: 0;
  }
`;

type EmptyAreaProps = {
  heading: string;
  info: string;
};

export const EmptySuccessPlanArea: React.FC<EmptyAreaProps> = ({
  heading,
  info,
}) => {
  return (
    <DashedBorderArea>
      <DashedBorderSvg>
        <rect></rect>
      </DashedBorderSvg>
      <EmptyAreaHeading options={{ forceBlock: true }}>
        {heading}
      </EmptyAreaHeading>
      <SlateCopy>{info}</SlateCopy>
    </DashedBorderArea>
  );
};
