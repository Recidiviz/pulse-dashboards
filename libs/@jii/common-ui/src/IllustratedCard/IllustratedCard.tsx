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
import { MouseEventHandler, ReactNode } from "react";
import { Link } from "react-router-dom";
import styled, { css } from "styled-components";

import { spacing } from "~design-system";

import { Card } from "../Card";

const ILLUSTRATION_MIN_WIDTH = 200;
const CONTENT_MIN_WIDTH = 300;

const Wrapper = styled(Card)`
  padding: 0;
  display: flex;
  // together with the min widths below, this stacks the two columns
  // when the card is too narrow to fit them side by side
  flex-wrap: wrap;
  overflow: hidden;
`;

const PLACEMENT_ALIGNMENT = {
  top: "flex-start",
  center: "center",
  bottom: "flex-end",
} as const;

export type IllustrationPlacement = keyof typeof PLACEMENT_ALIGNMENT;

type IllustrationColumnProps = {
  $background?: string;
  $placement: IllustrationPlacement;
};

// a panel of color with the artwork centered in it;
// the artwork shrinks to fit but is never enlarged
const illustrationColumnStyles = css<IllustrationColumnProps>`
  background-color: ${({ $background }) => $background || "transparent"};

  flex: 1;
  min-width: ${rem(ILLUSTRATION_MIN_WIDTH)};

  display: flex;
  align-items: ${({ $placement }) => PLACEMENT_ALIGNMENT[$placement]};
  justify-content: center;
`;

const IllustrationContainer = styled.div<IllustrationColumnProps>`
  ${illustrationColumnStyles}
`;

// the illustration duplicates a link that the card contents should also
// contain, so it is kept out of the tab order and the accessibility tree
const IllustrationLink = styled(Link).attrs({
  tabIndex: -1,
  "aria-hidden": "true",
})<IllustrationColumnProps>`
  ${illustrationColumnStyles}
`;

const IllustrationButton = styled.button<IllustrationColumnProps>`
  ${illustrationColumnStyles}

  border: none;
  cursor: pointer;
`;

const Illustration = styled.img`
  display: block;

  // drawn at its native size, shrinking only if the column is smaller
  max-width: 100%;
  height: auto;
`;

const CardContent = styled.div`
  // anchors anything the contents position absolutely, e.g. a close button
  position: relative;

  flex: 2;
  min-width: ${rem(CONTENT_MIN_WIDTH)};
  padding: ${rem(spacing.lg)};
`;

type IllustratedCardProps = {
  illustrationSrc: string;
  /** Describes the illustration; pass an empty string if it is purely decorative. */
  illustrationAlt: string;
  /** Fills the illustration column behind the artwork. */
  illustrationBackground: string;
  /** Where the artwork sits in its column, vertically. Defaults to center. */
  illustrationPlacement?: IllustrationPlacement;
  /** If provided, the illustration becomes a link to this path. */
  illustrationLink?: string;
  /**
   * Called when the illustration is clicked. Without a link, this makes the
   * illustration a button.
   */
  illustrationOnClick?: MouseEventHandler<HTMLElement>;
  children: ReactNode;
  className?: string;
};

/**
 * A card with an illustration alongside its contents, which stack when the
 * card is too narrow to fit them side by side.
 */
export function IllustratedCard({
  illustrationSrc,
  illustrationAlt,
  illustrationBackground,
  illustrationPlacement = "center",
  illustrationLink,
  illustrationOnClick,
  children,
  className,
}: IllustratedCardProps) {
  const illustration = (
    <Illustration src={illustrationSrc} alt={illustrationAlt} />
  );
  const columnProps = {
    $background: illustrationBackground,
    $placement: illustrationPlacement,
  };

  let illustrationColumn: ReactNode;
  if (illustrationLink) {
    illustrationColumn = (
      <IllustrationLink
        to={illustrationLink}
        onClick={illustrationOnClick}
        {...columnProps}
      >
        {illustration}
      </IllustrationLink>
    );
  } else if (illustrationOnClick) {
    illustrationColumn = (
      <IllustrationButton
        type="button"
        onClick={illustrationOnClick}
        {...columnProps}
      >
        {illustration}
      </IllustrationButton>
    );
  } else {
    illustrationColumn = (
      <IllustrationContainer {...columnProps}>
        {illustration}
      </IllustrationContainer>
    );
  }

  return (
    <Wrapper {...{ className }}>
      {illustrationColumn}
      <CardContent>{children}</CardContent>
    </Wrapper>
  );
}
