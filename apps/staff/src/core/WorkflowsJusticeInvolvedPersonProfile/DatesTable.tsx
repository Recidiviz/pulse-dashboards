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

import { palette, Sans14, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import {
  formatDueDateFromToday,
  formatWorkflowsDate,
} from "../../utils/formatStrings";
import { InfoButton } from "./InfoButton";
import { InfoTooltipWrapper } from "./styles";

const DateTable = styled.table`
  ${typography.Sans14};
  color: ${palette.slate80};
  border-spacing: 0;
  border-collapse: separate;
  margin: ${rem(spacing.md)} 0;
  width: 100%;
`;

const DateTableCell = styled.td`
  border: 1px ${palette.slate20};

  border-top-style: solid;
  border-left-style: solid;
  padding: ${rem(spacing.sm)};
`;

const ShadedDateTableCell = styled(DateTableCell)<{ $highlight?: boolean }>`
  background-color: ${palette.marble3};
  white-space: nowrap;
  width: 30%;

  ${({ $highlight }) => $highlight && `color: ${palette.signal.notification};`}
`;

const DateTableRow = styled.tr`
  /* last column: right border */
  & ${DateTableCell}:last-child {
    border-right-style: solid;
  }

  /* first row: round corners */
  &:first-child {
    & ${DateTableCell} {
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
    & ${DateTableCell} {
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

const DateExplainer = styled(Sans14)<{ $datePast: boolean }>`
  display: inline;
  color: ${(props) =>
    props.$datePast ? palette.signal.error : palette.slate60};
`;

export type DateInfo = {
  label: string;
  date?: Date;
  tooltip?: string;
  highlight?: boolean;
};

export function DatesTable({
  dates,
  highlightPastDates,
}: {
  dates: DateInfo[];
  highlightPastDates: boolean;
}) {
  const today = new Date();
  return (
    <DateTable>
      <tbody>
        {dates.map(({ label, date, tooltip, highlight }) => (
          <DateTableRow key={label}>
            <ShadedDateTableCell $highlight={highlight}>
              {label}
              {tooltip && (
                <>
                  {" "}
                  <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                    <InfoButton infoUrl={undefined} />
                  </InfoTooltipWrapper>
                </>
              )}
            </ShadedDateTableCell>
            <DateTableCell>
              {formatWorkflowsDate(date)}
              {date && (
                <>
                  {" "}
                  <DateExplainer
                    $datePast={highlightPastDates && new Date(date) < today}
                  >
                    {`(${formatDueDateFromToday(new Date(date))})`}
                  </DateExplainer>
                </>
              )}
            </DateTableCell>
          </DateTableRow>
        ))}
      </tbody>
    </DateTable>
  );
}
