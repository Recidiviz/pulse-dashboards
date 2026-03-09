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

import { rem } from "polished";
import styled from "styled-components";

import { Card, CardValue, CopyWrapper, SlateCopy } from "~@jii/common-ui";
import { palette, spacing } from "~design-system";

export type CardHighlightStyle = "green" | "purple" | "dashed";

interface StyledCardProps {
  $isUpcoming: boolean;
  $highlightType?: CardHighlightStyle;
}

export const DashedBorderSvg = styled.svg`
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

export const StyledCard = styled(Card)<StyledCardProps>`
  margin: ${rem(spacing.md)} 0;
  padding-right: ${rem(spacing.xl)};

  /* Upcoming styling */
  ${({ $isUpcoming }) =>
    $isUpcoming &&
    `
    background-color: ${palette.slate05};
    border: 1px solid ${palette.signal.notification};

    /* Blue text for CardValue when upcoming */
    ${CardValue} {
      color: ${palette.signal.notification};
    }
  `}

  /* Highlight border styling */
  ${({ $highlightType }) => {
    if ($highlightType === "green") {
      return `border-top: 8px solid ${palette.pine3};`;
    }
    if ($highlightType === "purple") {
      return `border-top: 8px solid #624488;`;
    }
    if ($highlightType === "dashed") {
      return `border: none;
      position: relative;`;
    }
    return "";
  }}
`;

export const SectionSubHeader = styled(SlateCopy)`
  && {
    margin-bottom: ${rem(spacing.lg)};
  }
`;

export const DateInfoContent = styled(CopyWrapper).attrs({
  options: { forceBlock: true },
})`
  margin-top: ${rem(spacing.xxl)};
`;

export const LearnMoreLinkWrapper = styled.div`
  margin-top: ${rem(spacing.md)};
`;

export const StyledSlateCopy = styled(SlateCopy)<{ $isPastDate?: boolean }>`
  ${({ $isPastDate }) => $isPastDate && `color: ${palette.data.gold2};`}
`;

export const CardValueWrapper = styled.span`
  display: inline-block;
  margin-right: ${rem(spacing.md)};
`;
