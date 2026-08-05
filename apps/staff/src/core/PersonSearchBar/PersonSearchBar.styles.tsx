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
import { GroupBase, StylesConfig } from "react-select";
import styled from "styled-components";

import { palette, Sans12, Sans14, spacing } from "~design-system";

import {
  searchBarContainerStyles,
  searchBarControlStyles,
  searchBarGroupHeadingStyles,
  searchBarGroupStyles,
  searchBarMenuStyles,
  searchBarOptionHoverStyle,
  searchBarOptionTextColor,
  searchBarPlaceholderStyles,
} from "../WorkflowsSearchBar/WorkflowsSearchBar.styles";
import type { PersonSearchOption } from "./PersonSearchBar";

const personSearchBarFontSize = rem(14);

export const PersonSearchBarContainer = styled.div`
  position: relative;
  width: 100%;
`;

export const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  width: 100%;
`;

export const OptionNameGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const OptionName = styled(Sans14)`
  color: ${searchBarOptionTextColor};
  font-size: ${personSearchBarFontSize};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const OptionExternalId = styled(Sans12)`
  color: ${palette.slate60};
`;

export const personSearchBarStyles: StylesConfig<
  PersonSearchOption,
  false,
  GroupBase<PersonSearchOption>
> = {
  container: (base) => searchBarContainerStyles(base),
  placeholder: (base) => ({
    ...searchBarPlaceholderStyles(base),
    fontSize: personSearchBarFontSize,
  }),
  input: (base) => ({
    ...base,
    fontSize: personSearchBarFontSize,
  }),
  control: (base, state) => ({
    ...searchBarControlStyles(base, state),
    borderRadius: rem(4),
  }),
  menu: (base) => searchBarMenuStyles(base),
  menuList: (base) => ({
    ...base,
    maxHeight: rem(320),
  }),
  group: (base) => searchBarGroupStyles(base),
  groupHeading: (base) => ({
    ...searchBarGroupHeadingStyles(base),
    padding: `${rem(spacing.xs)} ${rem(spacing.md)}`,
  }),
  option: (base, state) => ({
    ...base,
    // isFocused covers both keyboard arrow-key highlighting and mouse hover
    backgroundColor: state.isFocused ? palette.slate10 : "transparent",
    padding: `${rem(spacing.sm)} ${rem(spacing.md)}`,
    ...searchBarOptionHoverStyle,
  }),
};
