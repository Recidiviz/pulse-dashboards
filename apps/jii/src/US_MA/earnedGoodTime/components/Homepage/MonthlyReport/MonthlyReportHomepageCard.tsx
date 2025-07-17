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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import React from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { Card } from "../../../../../common/components/Card";
import { CopyWrapper } from "../../../../../components/CopyWrapper/CopyWrapper";
import { hydrateTemplate } from "../../../../../configs/hydrateTemplate";
import { useEGTDataContext } from "../../EGTDataContext/context";
import { SectionHeading } from "../styles";
import { SlateCopy } from "../styles";
import { MonthlyReportPresenter } from "./MonthlyReportPresenter";
import { MonthlyReportSelector } from "./MonthlyReportSelector";

const ActivityRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${rem(spacing.lg)};
  height: ${rem(24)};
  margin: ${rem(spacing.sm)} 0;
`;

const ActivityList = styled.div`
  margin: ${rem(spacing.md)} 0;
`;

const ActivityRowDivider = styled.hr`
  border-top: 1px solid ${palette.slate10};
  margin: ${rem(spacing.xs)} ${rem(spacing.xxs)};

  &:last-child {
    display: none;
  }
`;

const CreditTotals = styled.div`
  display: flex;
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(spacing.sm)};
  margin: ${rem(spacing.md)} 0;
`;

const CreditTypeCard = styled.div`
  flex: 1;
  border-right: 1px solid ${palette.slate10};
  margin: 0 ${rem(spacing.sm)};
  padding: ${rem(spacing.lg)};
  border-radius: ${rem(spacing.sm)} 0 0 ${rem(spacing.sm)};

  &:last-child {
    border-right: none;
  }
`;

const CardValue = styled.div`
  ${typography.Sans24};

  font-size: ${rem(24)};
`;

const ManagedComponent: FC<{
  presenter: MonthlyReportPresenter;
}> = observer(function MonthlyReportHomepageCard({ presenter }) {
  return (
    <section>
      <SectionHeading>{presenter.sectionTitle}</SectionHeading>
      <Card>
        <MonthlyReportSelector
          placeholder={presenter.selectPlaceholder}
          options={presenter.sortedSelectOptions}
          onChange={presenter.setSelectedMonthYearStartDate}
        />
        <CreditTotals>
          <CreditTypeCard>
            <SlateCopy>{presenter.copy.egt.label}</SlateCopy>
            <CardValue>
              {hydrateTemplate(presenter.copy.egt.value, {
                totalEGTCreditDays: presenter.totalEGTCreditDays,
              })}
            </CardValue>
          </CreditTypeCard>
          <CreditTypeCard>
            <SlateCopy>{presenter.copy.boosts.label}</SlateCopy>
            <CardValue>
              {hydrateTemplate(presenter.copy.boosts.value, {
                totalBoostCreditDays: presenter.totalBoostCreditDays,
              })}
            </CardValue>
          </CreditTypeCard>
          <CreditTypeCard>
            <SlateCopy>{presenter.copy.credits.label}</SlateCopy>
            <CardValue>
              {hydrateTemplate(presenter.copy.credits.value, {
                totalCompletionCreditDays: presenter.totalCompletionCreditDays,
              })}
            </CardValue>
          </CreditTypeCard>
        </CreditTotals>
        <ActivityList>
          {presenter.creditActivity.map((activity, index) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <React.Fragment key={index}>
                <ActivityRow>
                  <CopyWrapper>{activity.activity}</CopyWrapper>
                  <SlateCopy>
                    {presenter.ratingDisplayName(activity.rating)}
                  </SlateCopy>
                </ActivityRow>
                <ActivityRowDivider />
              </React.Fragment>
            );
          })}
        </ActivityList>
      </Card>
    </section>
  );
});

function usePresenter() {
  const {
    copy: {
      home: { monthlyReport: monthlyReportCopy },
    },
    monthlyReports,
  } = useEGTDataContext();

  return new MonthlyReportPresenter(monthlyReports, monthlyReportCopy);
}

export const MonthlyReportHomepageCard = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
});
