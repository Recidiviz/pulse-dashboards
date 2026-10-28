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

import { hideVisually } from "polished";
import { ReactNode } from "react";
import styled, { css, keyframes } from "styled-components";

import { semantics } from "../theme";

const { radius, surface, type } = semantics;

// TODO(CO-935): Waiting on ~design-system to add a Skeleton component. Replace these primitives with it once it lands.
// Skeletons take the corner radius of the DS Button and fill with the hover
// surface, as the staff app's skeletons fill with slate20. The pulse matches
// the staff app's AddedTasksSkeleton.
const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const pulsing = css`
  background: ${surface.hover};
  border-radius: ${radius.control};
  animation: ${pulse} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

type Size = number | string;

const toCss = (size: Size) => (typeof size === "number" ? `${size}px` : size);

const Block = styled.span<{ $width: Size; $height: Size; $pill?: boolean }>`
  ${pulsing}
  ${({ $pill }) => $pill && `border-radius: ${radius.pill};`}
  display: block;
  flex-shrink: 0;
  width: ${({ $width }) => toCss($width)};
  height: ${({ $height }) => toCss($height)};
`;

/**
 * A pulsing placeholder block, for a button, a chip or any box whose content
 * hasn't loaded. Numbers are pixels; pill rounds it like the DS Button's
 * default shape. Screen readers skip it; wrap a skeleton in SkeletonGroup to
 * announce it.
 */
export function Skeleton({
  width = "100%",
  height,
  pill = false,
  className,
}: {
  width?: Size;
  height: Size;
  pill?: boolean;
  className?: string;
}) {
  return (
    <Block
      aria-hidden
      className={className}
      data-testid="skeleton"
      $width={width}
      $height={height}
      $pill={pill}
    />
  );
}

export type TypographyLevel = keyof typeof type;

// The line takes the typography level's font, and a non-breaking space gives
// it that level's line height, so it is exactly as tall as one line of the
// text it replaces.
const TextLine = styled.span<{ $width: Size; $level: TypographyLevel }>`
  ${({ $level }) => type[$level]}
  position: relative;
  display: block;
  width: ${({ $width }) => toCss($width)};
  max-width: 100%;
  margin: 0;

  &::before {
    content: "\\00a0";
  }
`;

// A text bar fills about the cap height, 0.7 of the font size, centred in the
// line.
const TextBar = styled(Block)`
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
`;

/**
 * A placeholder for one line of text in the given ~design-system typography
 * level: a bar sized to the font, in a box as tall as the line, so the layout
 * doesn't shift when the text arrives.
 */
export function SkeletonText({
  width,
  level,
  className,
}: {
  width: Size;
  level: TypographyLevel;
  className?: string;
}) {
  return (
    <TextLine aria-hidden className={className} $width={width} $level={level}>
      <TextBar data-testid="skeleton" $width="100%" $height="0.7em" />
    </TextLine>
  );
}

const VisuallyHidden = styled.span`
  ${hideVisually()}
`;

/**
 * Wraps a skeleton so assistive tech announces one "loading" status for it,
 * named by label (for example "Loading the calendar"), rather than nothing.
 */
export function SkeletonGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-label={label} className={className}>
      {/* The bars are hidden from assistive tech, so this text is what a
          screen reader announces. */}
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </div>
  );
}
