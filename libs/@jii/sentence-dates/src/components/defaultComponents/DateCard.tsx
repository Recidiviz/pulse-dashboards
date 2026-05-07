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

import cn from "classnames";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { Card } from "~@jii/common-ui";
import { palette, spacing } from "~design-system";

import { dateCardModifierClassesEnum } from "../SentenceDates/DatePresenter";
import { DateComponentDefaultProps } from "./types";

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

const CardWrapper = styled(Card)`
  display: grid;
  row-gap: ${rem(spacing.lg)};
  margin: 0;

  ${DashedBorderSvg} {
    display: none;
  }

  &.${dateCardModifierClassesEnum.enum["DateCard--is-upcoming"]} {
    background-color: ${palette.slate05};
    border: 1px solid ${palette.signal.notification};
  }

  &.${dateCardModifierClassesEnum.enum["DateCard--is-past"]} {
    border: none;
    position: relative;

    ${DashedBorderSvg} {
      display: block;
    }
  }
`;

export type DateCardProps = DateComponentDefaultProps;

export const DateCard: FC<DateCardProps> = ({
  children,
  datePresenter,
  className,
}) => {
  return (
    <CardWrapper
      className={cn([className, ...datePresenter.cardModifierClasses])}
    >
      <DashedBorderSvg>
        <rect />
      </DashedBorderSvg>
      {children}
    </CardWrapper>
  );
};
