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
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { Card } from "../../../../common/components/Card";
import { Chip } from "../../../../common/components/Chip";
import { hydrateTemplate } from "../../../../configs/hydrateTemplate";
import { UsMaEgtCopy } from "../../configs/US_MA/copy";
import { UsMaEGTMonthlyReport } from "../../models/UsMaEGTMonthlyReport";
import { CardHeading, TwoColumnWrapper } from "../styles";
import { MonthlyReportSectionHeading } from "./styles";

const DateCard = styled(Card)`
  align-content: space-between;
  display: grid;
  grid-template-rows: auto auto;
`;

const BreakdownList = styled.dl`
  ${typography.Sans14}

  color: ${palette.slate85};
  display: grid;
  grid-template-columns: 1fr auto;
  justify-content: space-between;
  margin-top: ${rem(spacing.xl)};
  margin-bottom: 0;

  dd {
    margin-bottom: ${rem(spacing.sm)};
    margin-left: ${rem(spacing.lg)};
    text-align: right;
  }
`;

const Total = styled(BreakdownList)`
  border-top: ${rem(1)} solid ${palette.slate20};
  color: ${palette.pine1};
  margin-top: 0;
  padding-top: ${rem(spacing.sm)};

  dd {
    margin-bottom: 0;
  }
`;

export const CreditsByDate: FC<{
  copy: UsMaEgtCopy;
  report: UsMaEGTMonthlyReport;
}> = ({
  copy: { individualMonthlyReport: monthlyReportCopy, tags },
  report,
  report: { monthDisplayName, totalRtsDateCreditDays, totalMaxDateCreditDays },
}) => {
  const templateContext = {
    monthDisplayName,
    totalRtsDateCreditDays,
    totalMaxDateCreditDays,
  };

  return (
    <>
      <MonthlyReportSectionHeading>
        {hydrateTemplate(
          monthlyReportCopy.dateChanges.heading,
          templateContext,
        )}
      </MonthlyReportSectionHeading>
      <TwoColumnWrapper>
        <DateCard>
          <CardHeading>
            {hydrateTemplate(
              monthlyReportCopy.dateChanges.rtsSummary,
              templateContext,
            )}
            <Chip color="green">{tags.rts}</Chip>
          </CardHeading>
          <div>
            <BreakdownList>
              <dt>{monthlyReportCopy.credits.egt.label}</dt>
              <dd>{report.totalEGTCreditDays}</dd>
              <dt>{monthlyReportCopy.credits.boosts.label}</dt>
              <dd>{report.totalBoostCreditDays}</dd>
              <dt>{monthlyReportCopy.credits.completion.label}</dt>
              <dd>{report.totalCompletionCreditDays}</dd>
            </BreakdownList>
            <Total>
              <dt>{monthlyReportCopy.dateChanges.totalsLabel}</dt>
              <dd>
                {hydrateTemplate(
                  monthlyReportCopy.dateChanges.rtsTotal,
                  templateContext,
                )}
              </dd>
            </Total>
          </div>
        </DateCard>
        <DateCard>
          <CardHeading>
            {hydrateTemplate(
              monthlyReportCopy.dateChanges.maxSummary,
              templateContext,
            )}
            <Chip color="green">{tags.maxRelease}</Chip>
          </CardHeading>
          <div>
            <BreakdownList>
              <dt>{monthlyReportCopy.credits.egt.label}</dt>
              <dd>{report.totalEGTCreditDays}</dd>
              <dt>{monthlyReportCopy.credits.boosts.label}</dt>
              <dd>{report.totalBoostCreditDays}</dd>
            </BreakdownList>
            <Total>
              <dt>{monthlyReportCopy.dateChanges.totalsLabel}</dt>
              <dd>
                {hydrateTemplate(
                  monthlyReportCopy.dateChanges.maxTotal,
                  templateContext,
                )}
              </dd>
            </Total>
          </div>
        </DateCard>
      </TwoColumnWrapper>
    </>
  );
};
