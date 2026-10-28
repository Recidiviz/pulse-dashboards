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
import { ReactNode } from "react";
import styled from "styled-components";

import { semantics } from "../../theme";

const { space, text, tile, type } = semantics;

// The name is 13px and turns semibold when its tile is selected; a name with
// a caption under it (a month) is 14px semibold. The group's compact styles
// set day numbers in Sans12.
const Name = styled.span.attrs({ className: "pb-tile-name" })`
  display: block;
  ${type.Sans14}
  font-size: ${tile.nameSize};
  line-height: ${tile.nameLineHeight};

  .ds-checkbox:has(input:checked) &,
  .ds-radio:has(input:checked) & {
    font-weight: 600;
  }

  .ds-checkbox__label:has(.pb-tile-caption) &,
  .ds-radio__label:has(.pb-tile-caption) & {
    ${type.Sans14}
    line-height: normal;
    font-weight: 600;
  }
`;

// The design draws the caption in slate at 60%, 3.0:1 on white, under the
// 4.5:1 WCAG asks of text, so it takes text.secondary. A disabled tile's
// caption ("Already added") takes text.disabled, since WCAG exempts inactive
// controls.
const Caption = styled.span.attrs({ className: "pb-tile-caption" })`
  display: block;
  margin-top: ${rem(space.xs)};
  ${type.Sans12}
  font-size: ${tile.captionSize};
  font-weight: 400;
  line-height: ${tile.captionLineHeight};
  letter-spacing: ${tile.captionTracking};
  text-transform: uppercase;
  color: ${text.secondary};

  .ds-checkbox:has(input:disabled) &,
  .ds-radio:has(input:disabled) & {
    color: ${text.disabled};
  }
`;

/**
 * A tile's text: its name and an optional caption under it, such as a
 * month's year. Both sit inside the DS item's label, so they name the input.
 */
export function OptionLabel({
  children,
  description,
}: {
  children: ReactNode;
  description?: ReactNode;
}) {
  return (
    <>
      <Name>{children}</Name>
      {description != null && description !== false && description !== "" && (
        <Caption>{description}</Caption>
      )}
    </>
  );
}
