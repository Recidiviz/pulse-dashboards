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
import styled from "styled-components";

import { preventFlexibleLayoutOverflow, SlateCopy } from "~@jii/common-ui";
import { useUsMaTranslations } from "~@jii/translation";
import { usMaEarnedCreditTypes } from "~datatypes";
import { palette } from "~design-system";

import { UsMaEGTMonthlyReport } from "../../models/UsMaEGTMonthlyReport";

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

    ${preventFlexibleLayoutOverflow}
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
  report: UsMaEGTMonthlyReport;
}> = observer(function ActivityTable({ report }) {
  const { t, i18n } = useUsMaTranslations();

  const {
    totalEGTCreditDays,
    totalBoostCreditDays,
    totalCompletionCreditDays,
  } = report;

  const tableCopy = t(($) => $.individualMonthlyReport.credits.table, {
    returnObjects: true,
  });

  return (
    <Wrapper>
      <TableRow>
        <div role="columnheader">{tableCopy.columnHeaders.program}</div>
        <div role="columnheader">
          {t(($) => $.individualMonthlyReport.credits.egtLabel)}
        </div>
        <div role="columnheader">
          {t(($) => $.individualMonthlyReport.credits.boostsLabel)}
        </div>
        <div role="columnheader">
          {t(($) => $.individualMonthlyReport.credits.completionLabel)}
        </div>
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
                {t(($) => $.creditRatings[activity.rating ?? "none"])}
              </ProgramSubtext>
            </div>
            {usMaEarnedCreditTypes.options.map((key) => (
              <div role="cell" key={key}>
                {activity[key] > 0 ? i18n.format(activity[key], "number") : "—"}
              </div>
            ))}
          </TableRow>
        );
      })}
      <TableRow boldFont={true}>
        <div role="cell">{tableCopy.aggregateColumn.label}</div>
        <div role="cell">
          {t(($) => $.individualMonthlyReport.credits.creditsValue, {
            count: totalEGTCreditDays,
          })}
        </div>
        <div role="cell">
          {t(($) => $.individualMonthlyReport.credits.creditsValue, {
            count: totalBoostCreditDays,
          })}
        </div>
        <div role="cell">
          {t(($) => $.individualMonthlyReport.credits.creditsValue, {
            count: totalCompletionCreditDays,
          })}
        </div>
      </TableRow>
    </Wrapper>
  );
});
