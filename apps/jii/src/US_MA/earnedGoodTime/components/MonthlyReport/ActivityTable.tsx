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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { hydrateTemplate } from "../../../../configs/hydrateTemplate";
import { UsMaEgtCopy } from "../../configs/US_MA/copy";
import { UsMaEGTMonthlyReport } from "../../models/UsMaEGTMonthlyReport";
import { mapRatingToDisplayName } from "../Homepage/MonthlyReport/MonthlyReportPresenter";
import { SlateCopy } from "../Homepage/styles";

const TableRow = styled.div.attrs({ role: "row" })<{ boldFont?: boolean }>`
  display: flex;
  border-top: 1px solid ${palette.slate10};
  padding: ${rem(spacing.md)} 0;
  vertical-align: middle;

  &:last-child {
    border-bottom: 1px solid ${palette.slate10};
  }

  div {
    font-size: ${rem(14)};
    align-items: center;
    ${(props) => (props.boldFont ? "font-weight: bold" : "")};
    flex: 1;
  }

  div:first-child {
    flex: 2;
  }

  &:first-of-type > div {
    color: ${palette.slate85};
  }
`;

const ProgramSubtext = styled(SlateCopy)`
  font-size: ${rem(14)};
`;

const Wrapper = styled.div.attrs({ role: "table" })`
  margin: ${rem(spacing.lg)} 0;
`;

export const ActivityTable: FC<{
  copy: UsMaEgtCopy;
  report: UsMaEGTMonthlyReport;
}> = observer(function ActivityTable({ copy, report }) {
  const {
    individualMonthlyReport: { credits },
  } = copy;

  const {
    totalEGTCreditDays,
    totalBoostCreditDays,
    totalCompletionCreditDays,
  } = report;

  return (
    <Wrapper>
      <TableRow>
        <div role="columnheader">{credits.table.columnHeaders.program}</div>
        <div role="columnheader">{credits.egt.label}</div>
        <div role="columnheader">{credits.boosts.label}</div>
        <div role="columnheader">{credits.completion.label}</div>
      </TableRow>
      {report.creditActivity.map((activity, index) => {
        return (
          // Below there isn't anything guaranteed unique in this array
          // eslint-disable-next-line react/no-array-index-key
          <TableRow key={index}>
            <div role="cell">
              <div>{activity.activity}</div>
              {/* replace with rating */}
              <ProgramSubtext>
                {mapRatingToDisplayName(activity.rating)}
              </ProgramSubtext>
            </div>
            <div role="cell">
              {activity["EARNEDGoodTime"] > 0
                ? activity["EARNEDGoodTime"]
                : "—"}
            </div>
            <div role="cell">
              {activity["BOOST"] > 0 ? activity["BOOST"] : "—"}
            </div>
            <div role="cell">
              {activity["COMPLETION"] > 0 ? activity["COMPLETION"] : "—"}
            </div>
          </TableRow>
        );
      })}
      <TableRow boldFont={true}>
        <div role="cell">{credits.table.aggregateColumn.label}</div>
        <div role="cell">
          {hydrateTemplate(credits.egt.value, {
            totalEGTCreditDays,
          })}
        </div>
        <div role="cell">
          {hydrateTemplate(credits.boosts.value, {
            totalBoostCreditDays,
          })}
        </div>
        <div role="cell">
          {hydrateTemplate(credits.completion.value, {
            totalCompletionCreditDays,
          })}
        </div>
      </TableRow>
    </Wrapper>
  );
});
