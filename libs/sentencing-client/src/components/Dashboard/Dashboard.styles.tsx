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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { SortDirection } from "@tanstack/react-table";
import { rem } from "polished";
import styled from "styled-components/macro";

import { customPalette } from "../styles/palette";
import { RecommendationStatusFilter } from "./types";

const TABLE_COLUMN_WIDTH = 400;

export const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 16px 24px;

  a {
    color: ${palette.text.normal};
  }
`;

export const WelcomeMessage = styled.div`
  display: flex;
  align-items: flex-start;
  background-color: ${palette.marble3};
  padding: 20px;
  margin-bottom: 8px;
  color: ${palette.pine4};
`;

export const CloseButton = styled.button`
  border: none;
  background-color: transparent;
  &:hover {
    cursor: pointer;
  }
`;

export const TitleDescriptionWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

export const WelcomeTitle = styled.div`
  ${typography.Sans16}
  font-weight: 700;
  margin-bottom: 8px;
`;

export const WelcomeDescription = styled.div`
  ${typography.Sans14}
  margin-bottom: 0;
  max-width: 929px;
`;

export const Cases = styled.div``;

export const CaseListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  align-items: flex-end;
`;

export const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

export const CaseOverviewItem = styled.div`
  border: 2px solid ${palette.slate30};
  border-radius: 5px;
  background: transparent;
  position: relative;
  z-index: 1;

  &::before {
    content: "";
    height: 100%;
    width: 5px;
    background-color: ${palette.slate30};
    position: absolute;
    left: 0px;
    top: 0px;
    z-index: 0;
    border-radius: 3px 0px 0px 3px;
  }
`;

export const CaseOverviewWrapper = styled.div<{ isHeader?: boolean }>`
  padding: ${({ isHeader }) => (isHeader ? "0" : "18px")} 24px;
  display: grid;
  grid-template-columns: 2fr repeat(4, 1fr) 2fr;
  column-gap: 20px;
`;

export const TableTitle = styled.div`
  ${typography.Serif34}
  color: ${palette.pine2};
  margin-bottom: 0;
`;

export const Button = styled.button`
  width: 117px;
  justify-self: end;
  background-color: ${palette.slate85};
  color: white;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 8px 16px;

  &:hover {
    cursor: pointer;
    background-color: ${palette.slate80};
  }
`;

export const DropdownContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  position: relative;
`;

export const DropdownTitle = styled.div`
  color: ${palette.slate60};
  align-self: flex-start;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
`;

export const DropdownButton = styled.button<{ isOpen?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 160px;
  padding: 12px 16px;
  background-color: transparent;
  border: 1px solid ${palette.slate30};
  border-radius: 8px;
  color: ${palette.pine3};
  margin-bottom: 1px;

  &::after {
    content: "";
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    margin-left: 5px;
    ${({ isOpen }) =>
      isOpen
        ? `border-bottom: 6px solid ${palette.pine3}`
        : `border-top: 6px solid ${palette.pine3}`};
  }
`;

export const Dropdown = styled.div`
  width: 208px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: ${palette.white};
  padding: 16px;
  border: 1px solid ${palette.slate30};
  border-radius: 10px;
  position: absolute;
  top: 67px;
  z-index: 100;
`;

export const DropdownHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const ClearButton = styled.div`
  &:hover {
    cursor: pointer;
  }
`;

export const DropdownOption = styled.div<{ isNested?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #006655;
  ${({ isNested }) => isNested && `margin-left: 20px;`}

  input[type="checkbox"] {
    accent-color: #006655;
  }

  label {
    margin-bottom: unset;
  }
`;

/** Table */

export const Table = styled.table`
  width: 100%;
  text-align: left;
  border-spacing: 0;
  border: 1px solid ${customPalette.white.white2};
`;

export const SortableHeader = styled.div<{ sortable?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  cursor: ${({ sortable }) => (sortable ? "pointer" : "default")};
`;

export const TableHeader = styled.thead`
  background-color: ${customPalette.white.white1};
`;

export const TableBody = styled.tbody`
  width: 100%;
`;

export const Row = styled.tr`
  color: ${palette.slate80};
  border-bottom: 1px solid ${customPalette.white.white2};

  & > td:first-child {
  }
`;

export const HeaderCell = styled.th`
  padding: 16px;
  color: ${customPalette.grey.grey3};
`;

export const Cell = styled.td<{ isLink?: boolean }>`
  width: ${rem(TABLE_COLUMN_WIDTH)};
  padding: 16px;

  ${({ isLink }) =>
    isLink &&
    `
    color: ${palette.pine4};

    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }
  `}
`;

export const Offense = styled.div<{ isNotSpecified: boolean }>`
  ${({ isNotSpecified }) => isNotSpecified && `color: ${palette.slate60};`}
`;

const statusToCSS = {
  "Not yet started": `
    color: rgba(58, 80, 90, 1);
    background-color: rgba(227, 234, 237, 1);
  `,
  "In Progress": `
    color: rgba(107, 80, 39, 1);
    background-color: rgba(253, 236, 210, 1);
  `,
  Complete: `
    color: rgba(42, 73, 67, 1);
    background-color: ${customPalette.teal}
  `,
  Archived: `
    color: rgba(20, 28, 65, 1);
    background-color: rgba(200, 229, 255, 1);
  `,
  Cancelled: `
    color: rgba(76, 12, 28, 1);
    background-color: rgba(255, 220, 229, 1);
  `,
};

export const StatusChip = styled.div<{
  status: RecommendationStatusFilter;
}>`
  ${typography.Sans16}
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  border-radius: 100px;
  padding: 0px 8px;
  line-height: 18px;
  font-size: 13px;
  text-transform: capitalize;
  ${({ status }) => statusToCSS[status]}
`;

const svgPathFillCSS = `
  fill-rule: none;
  fill-opacity: 1 !important;
  fill: rgb(0, 108, 103, 1);
`;

export const SortIconWrapper = styled.div<{
  sortDirection: false | SortDirection;
}>`
  ${({ sortDirection }) => {
    if (sortDirection === "asc") {
      return `
          svg > path:first-child {
            ${svgPathFillCSS}
          }
        `;
    }
    if (sortDirection === "desc") {
      return `
          svg > path:last-child {
            ${svgPathFillCSS}
          }
        `;
    }
    return "";
  }};
`;

export const SupervisorDashboardContainer = styled.div`
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export const TopLineStats = styled.div`
  width: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
`;

export const StatsWrapper = styled.div`
  display: flex;
  gap: 24px;
  margin: 12px 0 32px 0;
`;

export const StatsDescription = styled.div`
  ${typography.Sans18}
  width: 100%;
  color: ${palette.pine4};
  span {
    color: ${palette.slate60};
  }
`;

export const StatCard = styled.div`
  min-width: 200px;
  border: 1px solid ${palette.slate20};
  border-radius: 4px;
  padding: 20px;
`;

export const Stat = styled.div`
  ${typography.Header34}
  font-size: 42px;
  margin-bottom: 8px;
  color: ${palette.data.forest1};
`;

export const StatLabel = styled.div`
  color: ${palette.slate80};
`;
