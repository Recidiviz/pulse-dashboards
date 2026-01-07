// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { spacing, typography } from "@recidiviz/design-system";
import { sortBy } from "lodash";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { UsNeCreditActivity } from "~datatypes";
import { palette } from "~design-system";

import { formatWorkflowsDate } from "../../../../utils";
import { DetailsHeading, DetailsSection } from "../../styles";
import { ResidentProfileProps } from "../../types";

// Custom table with proper header styling for Good Time Ledger
const GoodTimeTable = styled.table.attrs({
  className: "fs-exclude",
})`
  ${typography.Sans14};
  color: ${palette.slate80};
  border-spacing: 0;
  border-collapse: separate;
  margin-top: ${rem(spacing.md)};
  margin-bottom: ${rem(spacing.lg)};
  width: 100%;
  table-layout: fixed;
`;

const GoodTimeTableCell = styled.td`
  border: 1px solid ${palette.slate20};
  border-top: none;
  border-left: none;
  padding: ${rem(spacing.sm)};
  overflow-wrap: break-word;

  &:first-child {
    border-left: 1px solid ${palette.slate20};
  }
`;

const GoodTimeHeaderCell = styled.th`
  ${typography.Sans14};
  font-weight: 700;
  background-color: ${palette.marble3};
  border: 1px solid ${palette.slate20};
  border-bottom: none;
  border-left: none;
  padding: ${rem(spacing.sm)};
  text-align: left;

  &:first-child {
    border-left: 1px solid ${palette.slate20};
    border-top-left-radius: 4px;
  }

  &:last-child {
    border-top-right-radius: 4px;
  }
`;

const GoodTimeHeaderRow = styled.tr`
  & ${GoodTimeHeaderCell}:nth-child(1) {
    width: 35%;
  }
  & ${GoodTimeHeaderCell}:nth-child(2) {
    width: 20%;
  }
  & ${GoodTimeHeaderCell}:nth-child(3) {
    width: 15%;
  }
  & ${GoodTimeHeaderCell}:nth-child(4) {
    width: 30%;
  }
`;

const GoodTimeBodyRow = styled.tr`
  & ${GoodTimeTableCell}:nth-child(1) {
    width: 35%;
  }
  & ${GoodTimeTableCell}:nth-child(2) {
    width: 20%;
  }
  & ${GoodTimeTableCell}:nth-child(3) {
    width: 15%;
  }
  & ${GoodTimeTableCell}:nth-child(4) {
    width: 30%;
  }

  &:last-child ${GoodTimeTableCell} {
    border-bottom: 1px solid ${palette.slate20};

    &:first-child {
      border-bottom-left-radius: 4px;
    }
    &:last-child {
      border-bottom-right-radius: 4px;
    }
  }
`;

function formatAdjustmentType(activity: UsNeCreditActivity): string {
  const baseType = activity.creditsEarned > 0 ? "Addition" : "Removal";

  if (activity.violationDescription) {
    const description = activity.violationDescription
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return `${baseType}: ${description}`;
  }

  return baseType;
}

function formatDays(creditsEarned: number): string {
  return creditsEarned > 0 ? `+${creditsEarned}` : `${creditsEarned}`;
}

export function UsNeGoodTimeLedger({
  resident,
}: ResidentProfileProps): React.ReactElement | null {
  const { metadata } = resident;

  if (metadata.stateCode !== "US_NE") {
    return null;
  }

  const creditActivity = metadata.creditActivity ?? [];
  const sortedActivity = sortBy(
    creditActivity,
    ({ creditDate }) => -creditDate,
  );

  if (sortedActivity.length === 0) {
    return null;
  }

  return (
    <DetailsSection>
      <DetailsHeading>Good Time Adjustment Ledger</DetailsHeading>
      <GoodTimeTable>
        <thead>
          <GoodTimeHeaderRow>
            <GoodTimeHeaderCell>Adjustment Type</GoodTimeHeaderCell>
            <GoodTimeHeaderCell>MR Number</GoodTimeHeaderCell>
            <GoodTimeHeaderCell>Days</GoodTimeHeaderCell>
            <GoodTimeHeaderCell>Transaction Date</GoodTimeHeaderCell>
          </GoodTimeHeaderRow>
        </thead>
        <tbody>
          {sortedActivity.map((activity) => (
            <GoodTimeBodyRow>
              <GoodTimeTableCell>
                {formatAdjustmentType(activity)}
              </GoodTimeTableCell>
              <GoodTimeTableCell>
                {activity.misconductReportNumber || ""}
              </GoodTimeTableCell>
              <GoodTimeTableCell>
                {formatDays(activity.creditsEarned)}
              </GoodTimeTableCell>
              <GoodTimeTableCell>
                {formatWorkflowsDate(activity.creditDate)}
              </GoodTimeTableCell>
            </GoodTimeBodyRow>
          ))}
        </tbody>
      </GoodTimeTable>
    </DetailsSection>
  );
}
