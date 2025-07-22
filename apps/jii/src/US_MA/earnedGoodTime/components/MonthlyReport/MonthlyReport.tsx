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
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { CopyWrapper } from "../../../../components/CopyWrapper/CopyWrapper";
import { usePageTitle } from "../../../../components/usePageTitle/usePageTitle";
import { hydrateTemplate } from "../../../../configs/hydrateTemplate";
import { State } from "../../../../routes/routes";
import { getMonthlyReportPageSlug } from "../../models/UsMaEGTMonthlyReport";
import { BackLink } from "../BackLink/BackLink";
import { useEGTDataContext } from "../EGTDataContext/context";
import {
  mapRatingToDisplayName,
  reportSelectOptions,
} from "../Homepage/MonthlyReport/MonthlyReportPresenter";
import { MonthlyReportSelector } from "../Homepage/MonthlyReport/MonthlyReportSelector";
import { SectionHeading, SlateCopy } from "../Homepage/styles";
import { CreditsByTypeCard } from "./CreditsByTypeCard";

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const TableRow = styled.div<{ boldFont?: boolean }>`
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

const ActivityTable = styled.div`
  margin: ${rem(spacing.lg)} 0;
`;

export const MonthlyReport = observer(function MonthlyReport() {
  const { copy, monthlyReports } = useEGTDataContext();
  const { reportDate, personPseudoId, stateSlug } = useTypedParams(
    State.Resident.EGT.MonthlyReport,
  );

  const {
    individualMonthlyReport: { credits, pageTitle, browserPageTitle },
  } = copy;

  const navigate = useNavigate();

  const report = monthlyReports.find(
    (report) => report.pageSlug === reportDate,
  );

  if (!report) {
    throw new Error();
  }

  usePageTitle(
    hydrateTemplate(browserPageTitle, {
      reportDisplayName: report.fullDisplayName,
    }),
  );

  const {
    totalEGTCreditDays,
    totalBoostCreditDays,
    totalCompletionCreditDays,
  } = report;

  return (
    <>
      <BackLink
        {...{
          children: copy.homeLink,
          to: State.Resident.EGT.buildPath(useTypedParams(State.Resident)),
        }}
      />
      <HeaderRow>
        <CopyWrapper>{`# ${pageTitle}`}</CopyWrapper>
        <MonthlyReportSelector
          placeholder={report.displayName}
          options={reportSelectOptions(monthlyReports)}
          onChange={(value) => {
            navigate(
              State.Resident.EGT.MonthlyReport.buildPath({
                stateSlug,
                personPseudoId,
                reportDate: `${getMonthlyReportPageSlug(value)}`,
              }),
            );
          }}
        />
      </HeaderRow>
      <SectionHeading>
        {hydrateTemplate(credits.sectionTitle, {
          monthDisplayName: report.monthDisplayName,
        })}
      </SectionHeading>
      <CreditsByTypeCard
        copy={credits}
        credits={{
          totalEGTCreditDays,
          totalBoostCreditDays,
          totalCompletionCreditDays,
        }}
        marginTopBottom={rem(spacing.lg)}
      />
      <ActivityTable>
        <TableRow>
          <div>{credits.table.columnHeaders.program}</div>
          <div>{credits.egt.label}</div>
          <div>{credits.boosts.label}</div>
          <div>{credits.credits.label}</div>
        </TableRow>
        {report.creditActivity.map((activity, index) => {
          return (
            // Below there isn't anything guaranteed unique in this array
            // eslint-disable-next-line react/no-array-index-key
            <TableRow key={index}>
              <div>
                <div>{activity.activity}</div>
                {/* replace with rating */}
                <ProgramSubtext>
                  {mapRatingToDisplayName(activity.rating)}
                </ProgramSubtext>
              </div>
              <div>
                {activity["EARNEDGoodTime"] > 0
                  ? activity["EARNEDGoodTime"]
                  : "—"}
              </div>
              <div>{activity["BOOST"] > 0 ? activity["BOOST"] : "—"}</div>
              <div>
                {activity["COMPLETION"] > 0 ? activity["COMPLETION"] : "—"}
              </div>
            </TableRow>
          );
        })}
        <TableRow boldFont={true}>
          <div>{credits.table.aggregateColumn.label}</div>
          <div>
            {hydrateTemplate(credits.egt.value, {
              totalEGTCreditDays,
            })}
          </div>
          <div>
            {hydrateTemplate(credits.boosts.value, {
              totalBoostCreditDays,
            })}
          </div>
          <div>
            {hydrateTemplate(credits.credits.value, {
              totalCompletionCreditDays,
            })}
          </div>
        </TableRow>
      </ActivityTable>
    </>
  );
});
