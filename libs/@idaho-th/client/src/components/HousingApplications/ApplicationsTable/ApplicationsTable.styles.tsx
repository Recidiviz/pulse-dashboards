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

import { SortDirection } from "@tanstack/react-table";
import styled, { css, keyframes } from "styled-components";

import { breakpoints } from "../../../hooks/useIsMobile";
import {
  BodyS1,
  BodyS2,
  borderRadius,
  Caption1,
  Caption2,
  palette,
  spacing,
} from "../../../styles";
import AvatarBackground from "../../assets/avatar-background.svg?url";

const CELL_PADDING_X = spacing[4];

export const TableSection = styled.div`
  align-items: flex-start;
  align-self: center;
  display: flex;
  flex-direction: column;
  margin-top: ${spacing[4]};
  width: min(67.5rem, 95%);
`;
export const Container = styled.section`
  align-items: flex-start;
  background-color: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  border: 0.0625rem solid ${palette.misc.subtleAlpha};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 42.25rem;
  overflow: hidden;
  width: 100%;
`;
export const TableContent = styled.div`
  overflow-x: auto;
  width: 100%;
`;
export const TableInsets = styled.div`
  box-sizing: border-box;
  width: 100%;
`;
export const HeaderCellInner = styled.div<{ $align?: string }>`
  align-items: center;
  display: flex;
  gap: ${spacing[1]};
  justify-content: ${({ $align }) =>
    $align === "right" ? "flex-end" : "flex-start"};
  width: 100%;
`;
export const HeaderLabelRow = styled.span`
  align-items: center;
  display: inline-flex;
  gap: ${spacing[1]};
`;
export const Table = styled.table<{ $isTablet?: boolean }>`
  border-collapse: collapse;
  border-spacing: 0;
  padding: 0 ${spacing[3]};
  table-layout: fixed;
  width: 100%;

  @media (max-width: ${breakpoints.tablet}px) {
    table-layout: auto;
  }
`;
export const TableHeader = styled.thead`
  background-color: ${palette.misc.ghostWhite};
`;
export const HeaderCell = styled.th<{ $align?: string; $width?: string }>`
  box-sizing: border-box;
  color: ${palette.foreground.secondary};
  font-size: 0.875rem;
  font-weight: 500;
  height: 2.75rem;
  line-height: 1.25rem;
  padding: 0 ${CELL_PADDING_X};
  text-align: ${({ $align }) => $align ?? "left"};
  vertical-align: middle;
  white-space: nowrap;
  width: ${({ $width }) => $width ?? "auto"};
`;
export const Cell = styled.td`
  box-sizing: border-box;
  height: 4.5rem;
  padding: 0 ${CELL_PADDING_X};
  vertical-align: middle;
`;
export const CellSlot = styled.div<{ $align?: "start" | "center" | "end" }>`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: ${({ $align }) => {
    if ($align === "end") return "flex-end";
    if ($align === "center") return "center";
    return "flex-start";
  }};
  width: 100%;
`;
export const ClientNameCell = styled(Cell)``;
export const ClientNameContent = styled.div`
  align-items: center;
  display: flex;
  gap: ${spacing[2]};
  overflow: hidden;
  width: 100%;
`;
export const ClientAvatar = styled.div`
  align-items: center;
  background-image: url(${AvatarBackground});
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 50%;
  color: ${palette.foreground.onBrand};
  display: inline-flex;
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 500;
  height: 2rem;
  justify-content: center;
  line-height: 1rem;
  text-align: center;
  width: 2rem;
`;
export const AvatarWrapper = styled.div`
  flex-shrink: 0;
  height: 2rem;
  position: relative;
  width: 2rem;
`;
export const UnselectedProviderAvatar = styled(ClientAvatar)`
  filter: grayscale(100%);
  opacity: 0.6;
`;
export const HomePlanBadge = styled.span`
  align-items: center;
  background-color: ${palette.background.brand};
  border-radius: ${borderRadius.round};
  border: 0.09375rem solid ${palette.background.primary};
  bottom: -0.125rem;
  color: ${palette.foreground.onBrand};
  display: flex;
  height: 0.875rem;
  justify-content: center;
  position: absolute;
  right: -0.25rem;
  width: 0.875rem;
  svg {
    height: 7px;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 7px;
  }
`;
export const ClientNameTextGroup = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;
export const ClientNameText = styled(BodyS1)`
  color: ${palette.foreground.primary};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
export const HomePlanCaptionText = styled(Caption1)`
  color: ${palette.foreground.secondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
export const Row = styled.tr`
  cursor: pointer;
  height: 4.5rem;
  &:hover {
    background-color: ${palette.state.hover};
  }
  &:hover ${ClientNameText} {
    text-decoration: underline;
  }
  &:focus-visible {
    background-color: ${palette.background.secondary};
    outline-offset: -0.125rem;
    outline: 0.125rem solid ${palette.state.focus};
  }
`;
export const ReleaseDateCell = styled(Cell)`
  color: ${palette.foreground.secondary};
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  white-space: nowrap;
  width: 9rem;
`;
export const ReleaseDateContent = styled.div`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  justify-content: center;
`;
export const ReleaseDateHighlight = styled.div`
  align-items: center;
  display: inline-flex;
  gap: ${spacing[1.5]};
`;
export const ReleaseDateDot = styled.span`
  background-color: ${palette.misc.seaBlue};
  border-radius: 50%;
  flex-shrink: 0;
  height: 0.25rem;
  width: 0.25rem;
`;
export const ReleaseDateHighlightText = styled(BodyS2)`
  color: ${palette.misc.seaBlue};
`;
export const ReleaseDateAnnotationRow = styled.div`
  align-items: center;
  display: inline-flex;
  gap: ${spacing[0.5]};
  svg {
    color: ${palette.misc.seaBlue};
  }
`;
export const ReleaseDateAnnotationText = styled(Caption1)`
  color: ${palette.misc.seaBlue};
`;
export const StageCell = styled(Cell)``;
export const StageContent = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;
export const StageTitle = styled(Caption2)`
  align-self: stretch;
  color: ${palette.foreground.primary};
  text-transform: capitalize;
`;
export const StageSubstageRow = styled.div`
  align-items: center;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  gap: 0.125rem;
  height: 1rem;
`;
export const StageSubstageIcon = styled.span`
  align-items: center;
  display: flex;
  flex: none;
  height: 0.75rem;
  justify-content: center;
  width: 0.75rem;
  & svg {
    display: block;
    height: 0.75rem;
    width: 0.75rem;
    path {
      fill: none;
      color: ${palette.foreground.tertiary};
    }
  }
`;
export const StageSubstageText = styled(Caption1)`
  color: ${palette.foreground.secondary};
  flex: none;
`;
export const StatusCell = styled(Cell)``;
export const ResponsesCell = styled(Cell)`
  color: ${palette.foreground.secondary};
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  white-space: nowrap;
  width: 7rem;
`;
export const AlertsCell = styled(Cell)``;
export const LastUpdatesContent = styled.div`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  justify-content: center;
`;
export const AlertWrapper = styled.div`
  align-items: center;
  display: inline-flex;
  gap: ${spacing[1]};
`;
export const AlertDot = styled.span`
  background-color: ${palette.misc.seaBlue};
  border-radius: 50%;
  flex-shrink: 0;
  height: 0.25rem;
  width: 0.25rem;
`;
export const AlertText = styled(Caption2)`
  color: ${palette.misc.seaBlue};
`;
export const NoAlertText = styled(Caption2)`
  color: ${palette.foreground.attention};
`;
export const NewApplicationDot = styled.span`
  background-color: ${palette.foreground.brand};
  border-radius: 50%;
  flex-shrink: 0;
  height: 0.25rem;
  width: 0.25rem;
`;
export const NewApplicationText = styled(Caption2)`
  color: ${palette.foreground.brand};
`;
export const LastUpdatedDateText = styled(Caption2)`
  color: ${palette.foreground.secondary};
`;
export const SortableHeader = styled.div<{
  $sortable: boolean;
  $align?: string;
}>`
  align-items: center;
  cursor: ${({ $sortable }) => ($sortable ? "pointer" : "default")};
  display: flex;
  gap: ${spacing[1]};
  user-select: none;
`;
export const SortIconWrapper = styled.div<{
  $sortDirection: false | SortDirection;
}>`
  align-items: center;
  display: flex;
  height: 1rem;
  width: 1rem;
  svg path:first-child {
    fill: ${({ $sortDirection }) =>
      $sortDirection === "asc"
        ? palette.state.focus
        : palette.foreground.tertiary};
    transition: fill 0.15s ease;
  }
  svg path:last-child {
    fill: ${({ $sortDirection }) =>
      $sortDirection === "desc"
        ? palette.state.focus
        : palette.foreground.tertiary};
    transition: fill 0.15s ease;
  }
`;
export const LoadingContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  width: 100%;
  flex-direction: column;
  gap: ${spacing[3]};
  justify-content: center;
`;
export const LoadingText = styled.p`
  color: ${palette.misc.blackMuted};
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  margin: 0;
`;
export const PaginationContainer = styled.div`
  align-items: center;
  align-self: stretch;
  background: ${palette.background.primary};
  border-top: 0.0625rem solid ${palette.misc.subtleAlpha};
  display: inline-flex;
  gap: ${spacing[2]};
  justify-content: center;
  padding: ${spacing[3]};
  width: 100%;
`;
export const PaginationText = styled.span`
  color: ${palette.foreground.brand};
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  word-wrap: break-word;
`;
export const PaginationButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${palette.foreground.brand};
  cursor: pointer;
  display: flex;
  justify-content: center;
  padding: 0;
  &:disabled {
    cursor: default;
  }
`;
export const DividerCell = styled.td`
  height: 0.0625rem;
  line-height: 0;
  padding: 0 ${CELL_PADDING_X};
`;
export const DividerLine = styled.div`
  background-color: ${palette.misc.subtleAlpha};
  height: 0.0625rem;
  width: 100%;
`;
export const TableControlsRow = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0 0 ${spacing[3]};
  width: 100%;
`;
export const ClientCountText = styled.p`
  color: ${palette.foreground.secondary};
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  margin: 0;
`;
export const FilterButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${palette.foreground.primary};
  cursor: pointer;
  display: inline-flex;
  gap: ${spacing[1]};
  padding: 0;
  &:focus-visible {
    border-radius: ${borderRadius[4]};
    outline: 0.125rem solid ${palette.state.focus};
    outline-offset: 0.125rem;
  }
`;
export const FilterButtonText = styled.span`
  color: ${palette.foreground.primary};
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
`;
export const FilterEmptyCell = styled.td`
  color: ${palette.foreground.secondary};
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  padding: ${spacing[7]} ${spacing[4]};
  text-align: center;
`;
export const FilterDropdownAnchor = styled.div`
  position: relative;
`;

const filterDropdownOpen = keyframes`
  from {
    opacity: 0;
    transform: translateY(-0.375rem) scale(1);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

export const FilterDropdownPanel = styled.div`
  align-items: flex-start;
  animation: ${filterDropdownOpen} 0.18s ease-out;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  box-shadow: 0.1875rem 0.1875rem 1.875rem 0.3125rem ${palette.misc.shadowFaint};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  isolation: isolate;
  max-height: 20rem;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  padding: ${spacing[2]} 0 ${spacing[2]} ${spacing[3]};
  position: absolute;
  right: 0;
  top: calc(100% + 0.375rem);
  transform-origin: top right;
  width: 14.75rem;
  z-index: 30;
`;
export const FilterDropdownSlot = styled.div`
  align-items: flex-start;
  align-self: stretch;
  box-sizing: border-box;
  direction: ltr;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  max-height: 17.25rem;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0;
  scrollbar-color: ${palette.misc.subtleAlpha} transparent;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  width: 100%;
  &::-webkit-scrollbar {
    width: 0.25rem;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${palette.misc.subtleAlpha};
    border-radius: ${borderRadius.round};
  }
`;
export const FilterSectionDivider = styled.div.attrs({
  "aria-hidden": true,
})`
  border-top: 0.0625rem solid ${palette.border.subtle};
  box-sizing: border-box;
  margin: ${spacing[1]} 0;
  max-width: 100%;
  width: 100%;
`;
export const FilterExpandableSection = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  min-width: 0;
  padding: 0;
  width: 100%;
`;
export const FilterSectionHeader = styled.button`
  align-items: center;
  background-color: transparent;
  border: none;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  height: 1.75rem;
  min-height: 1.75rem;
  padding: ${spacing[1]};
  width: 100%;
  &:focus-visible {
    border-radius: ${borderRadius[4]};
    outline: 0.125rem solid ${palette.state.focus};
    outline-offset: 0.125rem;
  }
`;
export const FilterSectionTitle = styled.span`
  color: ${palette.foreground.primary};
  flex: 1;
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 400;
  height: 1.25rem;
  line-height: 1.25rem;
  min-width: 0;
  text-align: left;
`;
export const FilterSectionChevron = styled.span<{ $expanded: boolean }>`
  align-items: center;
  color: ${palette.foreground.tertiary};
  display: inline-flex;
  flex: none;
  flex-shrink: 0;
  height: 1.125rem;
  justify-content: center;
  transform: ${({ $expanded }) => ($expanded ? "scaleY(-1)" : "none")};
  transition: transform 0.15s ease;
  width: 1.125rem;
  svg {
    display: block;
    height: 0.5625rem;
    width: 0.6669rem;
  }
  svg path {
    stroke: currentColor;
  }
`;
export const FilterOptionList = styled.div`
  align-items: flex-start;
  align-self: stretch;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  min-width: 0;
  padding: 0 ${spacing[2]};
  width: 100%;
`;
export const FilterOptionItem = styled.button`
  align-items: center;
  align-self: stretch;
  background-color: transparent;
  border: none;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[2]};
  height: 2rem;
  min-height: 2rem;
  padding: 0;
  width: 100%;
  &:focus-visible {
    outline: 0.125rem solid ${palette.state.focus};
    outline-offset: -0.0625rem;
  }
`;
export const FilterCheckbox = styled.span<{ $checked: boolean }>`
  align-items: center;
  box-sizing: border-box;
  display: inline-flex;
  flex: none;
  height: 1.25rem;
  justify-content: center;
  min-height: 1.25rem;
  min-width: 1.25rem;
  position: relative;
  width: 1.25rem;
  &::before {
    background: ${({ $checked }) =>
      $checked ? palette.background.brand : palette.background.secondary};
    border: ${({ $checked }) =>
      $checked ? "none" : `0.078125rem solid ${palette.border.subtle}`};
    border-radius: 0.390625rem;
    box-sizing: border-box;
    content: "";
    display: block;
    height: 1.125rem;
    width: 1.125rem;
  }
  ${({ $checked }) =>
    $checked &&
    css`
      &::after {
        border: solid ${palette.background.primary};
        border-width: 0 0.105375rem 0.105375rem 0;
        box-sizing: border-box;
        content: "";
        height: 0.6325rem;
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-55%, -75%) rotate(45deg);
        width: 0.421875rem;
      }
    `}
`;
export const FilterOptionLabel = styled.span`
  color: ${palette.foreground.secondary};
  flex: 1;
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 400;
  height: 1.25rem;
  line-height: 1.25rem;
  min-width: 0;
  text-align: left;
`;
export const FilterDropdownFooter = styled.div`
  align-items: center;
  align-self: stretch;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: 0.625rem;
  height: 1.75rem;
  justify-content: space-between;
  max-width: 100%;
  min-height: 1.75rem;
  min-width: 0;
  padding-right: ${spacing[3]};
  width: 100%;
  z-index: 3;
`;
const filterFooterButtonCss = css`
  background-color: transparent;
  border: none;
  box-sizing: border-box;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1.25rem;
  white-space: nowrap;
  &:focus-visible {
    outline-offset: 0.125rem;
    outline: 0.125rem solid ${palette.state.focus};
  }
`;
export const FilterClearButton = styled.button`
  ${filterFooterButtonCss}
  color: ${palette.foreground.attention};
  flex-grow: 0;
  flex: none;
  font-weight: 500;
  height: 1.25rem;
  &:disabled {
    cursor: default;
    opacity: 0.4;
  }
`;
export const FilterCloseButton = styled.button`
  ${filterFooterButtonCss}
  color: ${palette.foreground.secondary};
  font-weight: 400;
`;
