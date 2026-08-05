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
import { useInView } from "react-intersection-observer";
import { components, CSSObjectWithLabel, MenuListProps } from "react-select";
import styled from "styled-components";

import { palette, spacing, zindex } from "~design-system";

// Shared look-and-feel for the react-select-based search bars used in the
// Workflows nav (CaseloadSelect, PersonSearchBar). These are style-fragment
// helpers rather than a full StylesConfig, since each search bar composes
// them with its own state-dependent overrides (menuIsOpen borders, mobile
// layout, multi-value styling, etc).

export const searchBarControlStyles = (
  base: CSSObjectWithLabel,
  state?: { isFocused: boolean },
): CSSObjectWithLabel => ({
  ...base,
  backgroundColor: state?.isFocused ? palette.slate05 : base.backgroundColor,
  borderColor: `${palette.slate30} !important`,
  boxShadow: "none",
  minHeight: rem(40),
});

export const searchBarMenuStyles = (
  base: CSSObjectWithLabel,
  isMobile = false,
): CSSObjectWithLabel => ({
  ...base,
  zIndex: zindex.tooltip - 1,
  border: `1px solid ${palette.slate30}`,
  boxShadow: isMobile ? "none" : `0px 10px 40px ${palette.slate20}`,
});

export const searchBarOptionHoverStyle: CSSObjectWithLabel = {
  "&:hover": {
    backgroundColor: palette.slate10,
  },
};

export const searchBarOptionTextColor = palette.pine3;
export const searchBarOptionFontSize = rem(16);

export const searchBarGroupHeadingStyles = (
  base: CSSObjectWithLabel,
): CSSObjectWithLabel => ({
  ...base,
  color: palette.slate60,
  fontSize: rem(12),
  lineHeight: rem(14.4),
  marginBottom: rem(8),
  textTransform: "capitalize",
});

export const searchBarGroupStyles = (
  base: CSSObjectWithLabel,
): CSSObjectWithLabel => ({
  ...base,
  paddingTop: rem(spacing.sm),
  borderBottom: `1px solid ${palette.slate10}`,

  "&:nth-last-child(2)": {
    paddingTop: rem(spacing.md),
    borderBottom: "none",
  },
});

export const searchBarContainerStyles = (
  base: CSSObjectWithLabel,
): CSSObjectWithLabel => ({
  ...base,
  fontSize: searchBarOptionFontSize,
});

export const searchBarPlaceholderStyles = (
  base: CSSObjectWithLabel,
): CSSObjectWithLabel => ({
  ...base,
  color: palette.text.secondary,
});

// Fades the top/bottom edge of a scrollable results menu so a cut-off row
// reads as "more below" rather than looking like the last one.
export const ScrollShadow = styled.div<{
  show: boolean;
  side: "top" | "bottom";
}>`
  background: linear-gradient(
    ${({ side }) => (side === "top" ? 180 : 360)}deg,
    ${palette.marble1} 3.13%,
    transparent 109.62%
  );
  pointer-events: none;
  position: absolute;
  opacity: ${({ show }) => (show ? 1 : 0)};
  transition: all 200ms ease;
  ${({ side }) => side === "bottom" && "bottom: 0;"}
  width: 100%;
  height: 3em;
  z-index: ${zindex.tooltip - 1};
`;

const MIN_ENTRIES_FOR_SCROLLABLE_MENU = 9;

export function createMenuListWithScrollShadow<Option, IsMulti extends boolean>(
  entriesNumber: number,
) {
  return function MenuList({
    children,
    ...props
  }: MenuListProps<Option, IsMulti>) {
    const topShadow = useInView();
    const bottomShadow = useInView();

    return (
      <>
        <ScrollShadow
          show={
            !!topShadow.entry &&
            !topShadow.inView &&
            entriesNumber >= MIN_ENTRIES_FOR_SCROLLABLE_MENU
          }
          side="top"
        />
        <components.MenuList {...props}>
          <div ref={topShadow.ref} />
          {children}
          <div ref={bottomShadow.ref} />
        </components.MenuList>
        <ScrollShadow
          show={
            !bottomShadow.inView &&
            entriesNumber >= MIN_ENTRIES_FOR_SCROLLABLE_MENU
          }
          side="bottom"
        />
      </>
    );
  };
}
