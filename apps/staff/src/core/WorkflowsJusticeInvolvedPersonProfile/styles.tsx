// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { spacing, TooltipTrigger, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { Button, palette } from "~design-system";

export const DetailsSection = styled.dl``;

export const DetailsBorderedSection = styled(DetailsSection)`
  border-top: 1px solid ${palette.slate10};
  border-bottom: 1px solid ${palette.slate10};
  margin: 0 -${rem(spacing.md)};
  padding: 0 ${rem(spacing.md)};
  background: ${palette.marble2};

  & + hr {
    display: none;
  }
`;

export const DetailsHeading = styled.dt`
  ${typography.Sans14}
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.sm)};
  margin-top: ${rem(spacing.md)};
`;

export const DetailsList = styled.dl``;

export const MilestonesList = styled.dl`
  align-items: flex-start;
  display: flex;
  gap: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.xs)};
`;

export const MilestoneMarker = styled.div`
  flex: 0 0 1em;
  padding-top: 0.1em;
`;

export const MilestonesItem = styled.span`
  display: block;
`;

export const PhoneNumber = styled.a`
  color: ${palette.signal.links};
  text-decoration: none;

  &:hover {
    color: ${palette.signal.links};
  }
`;

export const DetailsSubheading = styled.dt`
  ${typography.Sans14}
  color: ${palette.text.secondary};
  margin-bottom: ${rem(spacing.xs)};
`;

export const DetailsContent = styled.dd`
  ${typography.Sans14}
  color: ${palette.text.primary};
`;

export const SpecialConditionsCopy = styled.div`
  ${typography.Body12}
`;

const SmallDetailsCopy = styled.div`
  ${typography.Sans12}
`;

export const CaseNoteTitle = styled.span`
  font-weight: 700;
`;

export const CaseNoteDate = styled.span`
  color: ${palette.slate60};
`;

export type EmptySpecialConditionCopy = {
  parole: string;
  probation: string;
};

export const SecureSmallDetailsCopy = styled(SmallDetailsCopy).attrs({
  className: "fs-exclude",
})``;

export const SecureDetailsContent = styled(DetailsContent).attrs({
  className: "fs-exclude",
})``;

export const SecureDetailsList = styled(DetailsList).attrs({
  className: "fs-exclude",
})``;
export const PillButton = styled(Button).attrs({ kind: "secondary" })<{
  active?: boolean;
}>`
  color: ${palette.slate85};
  min-width: unset;
  min-height: unset;
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  margin: 0 ${rem(spacing.sm)} ${rem(spacing.sm)} 0;
  display: inline-block;
  ${({ active }) =>
    active &&
    `background-color: ${palette.slate10}; border-color: transparent;`}

  &:hover {
    background-color: ${palette.slate10};
  }

  &:focus:not(:hover) {
    ${({ active }) => !active && `background-color: unset;`}
  }
`;

export const InfoTooltipWrapper = styled(TooltipTrigger)`
  vertical-align: text-bottom;
`;

export const Separator = styled.span`
  color: ${palette.slate30};
`;

export const Divider = styled.hr`
  border-top: 1px solid ${palette.slate20};
  margin: ${rem(spacing.md)} 0;

  &:has(+ [class*="DetailsBorderedSection"]) {
    display: none;
  }

  :last-child {
    display: none;
  }
`;

export const DetailsBox = styled.div`
  border: 1px solid ${palette.slate10};
  border-radius: 4px;
  padding: ${rem(spacing.md)} 12px;
  display: flex;
  flex-direction: column;
  color: ${palette.slate};
  &:not(:first-child) {
    margin-top: ${rem(spacing.md)};
  }
`;

export const SmallDetailsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${rem(spacing.sm)};
  align-items: center;
`;

export const TextFieldHeader = styled.div`
  ${typography.Sans16}
  color: ${palette.slate85};
  margin-top: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.md)};
  display: flex;
`;

// Styled, PII-safe table with rounded borders that can include shaded cells

export const SidebarTable = styled.table.attrs({
  className: "fs-exclude",
})`
  ${typography.Sans14};
  color: ${palette.slate80};
  border-spacing: 0;
  border-collapse: separate;
  margin-top: ${rem(spacing.md)};
  margin-bottom: ${rem(spacing.lg)};
  width: 100%;
`;

export const SidebarTableCell = styled.td`
  border: 1px ${palette.slate20};

  border-top-style: solid;
  border-left-style: solid;
  padding: ${rem(spacing.sm)};
`;

export const ShadedSidebarTableCell = styled(SidebarTableCell)<{
  $highlight?: boolean;
}>`
  background-color: ${palette.marble3};
  white-space: nowrap;

  ${({ $highlight }) => $highlight && `color: ${palette.signal.notification};`}
`;

export const SidebarTableRow = styled.tr<{
  $wideLeftColumn?: boolean;
}>`
  /* first column: conditional width */
  & ${SidebarTableCell}:first-child {
    width: ${({ $wideLeftColumn }) => ($wideLeftColumn ? "70%" : "30%")};
  }

  /* last column: right border */
  & ${SidebarTableCell}:last-child {
    border-right-style: solid;
  }

  /* first row: round corners */
  &:first-child {
    & ${SidebarTableCell} {
      &:first-child {
        border-top-left-radius: 4px;
      }
      &:last-child {
        border-top-right-radius: 4px;
        border-right-style: solid;
      }
    }
  }

  /* last row: bottom border, round corners */
  &:last-child {
    & ${SidebarTableCell} {
      border-bottom-style: solid;

      &:first-child {
        border-bottom-left-radius: 4px;
      }
      &:last-child {
        border-bottom-right-radius: 4px;
      }
    }
  }
`;
