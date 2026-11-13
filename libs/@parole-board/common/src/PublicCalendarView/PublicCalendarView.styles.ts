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

import { rem, rgba } from "polished";
import styled from "styled-components";

import {
  baseButtonStyles,
  Button,
  secondaryButtonStyles,
} from "~design-system";

import { Callout } from "../components/Callout";
import { semantics } from "../theme";

const { border, opacity, radius, size, space, stroke, surface, text, type } =
  semantics;

// The month title is at least this wide, so the arrows stay put as the month
// name changes length. The design holds its 20px title at 160px; at Serif24
// the longest title, "September 2026", is 194px. A layout width, not a
// spacing step.
const MONTH_TITLE_MIN_WIDTH = 200;

// Seven 110px days. Narrower screens scroll the grid sideways rather than
// squeeze it, so the longest facility code, "DENCOM WTM BDY", still breaks
// only between words. A layout width, not a spacing step.
const GRID_MIN_WIDTH = 770;

// Each month arrow is a 44px square, the common minimum touch target, rather
// than the block Button's 32px. A control size, not a spacing step.
const ARROW_SIZE = 44;

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: ${surface.muted};
`;

export const Header = styled.header<{ $phone: boolean }>`
  padding: ${rem(space.lg)} ${({ $phone }) => rem($phone ? space.md : space.xl)};
  background: ${surface.bg};
  border-bottom: ${stroke.default} solid ${border.faint};
`;

// On a phone the month navigation sits under the title; wider, it sits on
// the right and wraps under the title only when the two don't fit.
export const HeaderRow = styled.div<{ $phone: boolean }>`
  display: flex;
  flex-direction: ${({ $phone }) => ($phone ? "column" : "row")};
  flex-wrap: wrap;
  align-items: ${({ $phone }) => ($phone ? "flex-start" : "flex-end")};
  justify-content: space-between;
  gap: ${({ $phone }) => rem($phone ? space.md : space.lg)};
`;

export const Title = styled.h1`
  ${type.Serif34}
  margin: 0;
  color: ${text.primary};
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${rem(space.sm)};
`;

export const MonthTitle = styled.h2`
  ${type.Serif24}
  min-width: ${rem(MONTH_TITLE_MIN_WIDTH)};
  margin: 0;
  color: ${text.primary};
  text-align: center;
`;

// TODO(CO-935): Waiting on ~design-system to let Button render a link (an href or as prop). Replace ArrowLink with that Button once it lands.
/**
 * An arrow that links to another month, drawn as the ~design-system
 * secondary block Button, which renders only a button element. The disabled
 * arrow at either end is that Button itself, as DisabledArrow, at the same
 * size.
 */
export const ArrowLink = styled.a`
  ${baseButtonStyles}
  ${secondaryButtonStyles}
  box-sizing: border-box;
  min-width: ${rem(ARROW_SIZE)};
  min-height: ${rem(ARROW_SIZE)};
  padding: ${rem(space.xs)} ${rem(space.sm)};
  border-radius: ${radius.control};
  text-decoration: none;
`;

/** The disabled arrow at the first or last month, as big as ArrowLink. */
export const DisabledArrow = styled(Button)`
  && {
    min-width: ${rem(ARROW_SIZE)};
    min-height: ${rem(ARROW_SIZE)};
  }
`;

export const Main = styled.main<{ $phone: boolean }>`
  flex: 1;
  padding: ${({ $phone }) =>
    $phone
      ? `${rem(space.md)} ${rem(space.md)} ${rem(space.xl)}`
      : `${rem(space.lg)} ${rem(space.xl)} ${rem(space.xxl)}`};
`;

// A month that's no longer live is greyed the way the design system greys a
// disabled control.
export const GridSurface = styled.div<{ $inactive?: boolean }>`
  min-width: ${rem(GRID_MIN_WIDTH)};
  background: ${surface.bg};
  opacity: ${({ $inactive }) => ($inactive ? opacity.disabled : 1)};
`;

/**
 * The no-longer-live banner: the admin's red strip for a month back in draft,
 * at the same height. Its tag says UPDATING rather than the admin's DRAFT,
 * a staff word the public page doesn't use.
 */
export const BannerStrip = styled(Callout)`
  min-height: ${size.banner};
`;

/** Holds the scroll area and its edge fades, which stay put as it scrolls. */
export const ScrollFrame = styled.div`
  position: relative;
`;

// The scroll padding keeps a cell scrolled into view clear of the left fade.
export const Scroller = styled.div`
  overflow-x: auto;
  scroll-padding-inline: ${rem(space.lg)};

  &:focus-visible {
    outline: ${stroke.focus} solid ${border.focus};
    outline-offset: ${stroke.focusOffset};
  }
`;

/** The skeleton's grid keeps the same width, cut off rather than scrolling. */
export const SkeletonClip = styled.div`
  overflow: hidden;
`;

/** Fades the grid out at a side that has more columns to scroll to. */
export const EdgeFade = styled.div<{ $side: "start" | "end" }>`
  position: absolute;
  top: 0;
  bottom: 0;
  ${({ $side }) => ($side === "start" ? "left" : "right")}: 0;
  width: ${rem(space.lg)};
  pointer-events: none;
  background: linear-gradient(
    to ${({ $side }) => ($side === "start" ? "right" : "left")},
    ${surface.bg},
    ${rgba(surface.bg, 0)}
  );
`;

export const Note = styled.p`
  ${type.Sans14}
  margin: 0 0 ${rem(space.md)};
  color: ${text.secondary};
`;

export const EmptyMessage = styled.p`
  ${type.Sans14}
  margin: 0;
  padding: ${rem(space.xxl)} 0;
  color: ${text.secondary};
  text-align: center;
`;

export const MessageArea = styled.div`
  padding: ${rem(space.xxl)} 0;

  a {
    color: ${text.link};
  }
`;
