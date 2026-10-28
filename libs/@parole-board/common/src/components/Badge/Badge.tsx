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
import styled, { css } from "styled-components";

import { Pill } from "~design-system";

import { semantics } from "../../theme";

const { radius, space, status, surface, text, type } = semantics;

/**
 * The fill and text colour of each tone. Every text colour meets WCAG AA
 * (4.5:1) on its fill; the Badge tests check each pairing.
 */
export const badgeTones = {
  neutral: { fill: surface.badge, text: text.primary },
  info: { fill: surface.info, text: status.info },
  success: { fill: surface.success, text: status.success },
  warning: { fill: surface.warning, text: status.warning },
  error: { fill: surface.error, text: status.error },
} as const;

export type BadgeTone = keyof typeof badgeTones;

/** "md" is the DS Pill's own size; "sm" fits a badge inside a calendar entry. */
export type BadgeSize = "sm" | "md";

// TODO(CO-935): Waiting on ~design-system to add a small Pill size. Drop this rule and pass the DS size once it lands.
const smallSize = css`
  height: ${rem(space.lg)};
  padding: 0 ${rem(space.sm)};
  border-radius: ${radius.pill};
`;

// The Pill's styling props stay off the DOM span.
const pillStyleProps = new Set(["color", "filled", "textColor"]);

// Sans12 replaces the Pill's Sans14, and the Pill's right margin goes, so a
// badge sits flush wherever its parent puts it.
const BadgeElement = styled(Pill).withConfig({
  shouldForwardProp: (prop) => !pillStyleProps.has(prop),
})<{ $size: BadgeSize; $uppercase: boolean }>`
  ${type.Sans12}
  margin-right: 0;
  ${({ $size }) => $size === "sm" && smallSize}
  ${({ $uppercase }) =>
    $uppercase &&
    css`
      text-transform: uppercase;
    `}
`;

export type BadgeProps = {
  /** The tag text. Pass it in normal case; the badge uppercases it by default. */
  children: ReactNode;
  tone: BadgeTone;
  /** Defaults to true. Screen readers still read the text as written. */
  uppercase?: boolean;
  /** Defaults to "md". */
  size?: BadgeSize;
  className?: string;
};

/**
 * A short status tag, such as "Draft", "Upload complete" or "Victim
 * attending", built on the ~design-system Pill. The tag always carries its
 * meaning as text, so colour is never the only signal.
 */
export function Badge({
  children,
  tone,
  uppercase = true,
  size = "md",
  className,
}: BadgeProps) {
  return (
    <BadgeElement
      className={className}
      filled
      color={badgeTones[tone].fill}
      textColor={badgeTones[tone].text}
      $size={size}
      $uppercase={uppercase}
    >
      {children}
    </BadgeElement>
  );
}
