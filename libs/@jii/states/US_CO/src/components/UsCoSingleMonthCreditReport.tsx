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

import { rem } from "polished";
import React from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components";

import {
  ActivityList,
  ActivityRow,
  BottomPaddedContainer,
  HistoryBackButton,
  HomepageSectionHeading,
  NotFound,
  RowDivider,
  usePageTitle,
} from "~@jii/common-ui";
import { useResidentMetadata, useSingleResidentContext } from "~@jii/data";
import { EGT } from "~@jii/paths";
import { useUsCoTranslations } from "~@jii/translation";
import { UsCoCreditType } from "~datatypes";
import { spacing } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { UsCoCreditReportPresenter } from "../presenters/UsCoCreditReportPresenter";

const Heading = styled(HomepageSectionHeading)`
  padding-top: ${rem(spacing.lg)};

  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

function CreditList({
  creditEntries,
}: {
  creditEntries: [UsCoCreditType, number][];
}) {
  const { t } = useUsCoTranslations();

  if (creditEntries.length === 0) {
    return <div>{t(($) => $.monthlyReport.noCreditsThisMonth)}</div>;
  }

  return (
    <ActivityList>
      {creditEntries.map(([creditType, creditDays]) => (
        <React.Fragment key={creditType}>
          <RowDivider />
          <ActivityRow>
            <div>{t(($) => $.monthlyReport.creditTypes[creditType])}</div>
            <div>
              {t(($) => $.monthlyReport.creditDays, { count: creditDays })}
            </div>
          </ActivityRow>
        </React.Fragment>
      ))}
    </ActivityList>
  );
}

function ManagedComponent({
  presenter,
}: {
  presenter: UsCoCreditReportPresenter;
}) {
  const { t } = useUsCoTranslations();
  const { reportDate } = useTypedParams(EGT.MonthlyReport);
  const report = presenter.monthlyReports[reportDate];

  usePageTitle(
    report && t(($) => $.monthlyReport.pageTitle, { date: report.date }),
  );

  if (!report) {
    return <NotFound />;
  }

  const { date, totalCredits, creditEntries } = report;

  return (
    <BottomPaddedContainer>
      <HistoryBackButton />
      <Heading>
        <div>{t(($) => $.monthlyReport.monthLabel, { date })}</div>
        <div>
          {t(($) => $.monthlyReport.creditDays, { count: totalCredits })}
        </div>
      </Heading>
      <CreditList creditEntries={creditEntries} />
    </BottomPaddedContainer>
  );
}

function usePresenter() {
  const { resident } = useSingleResidentContext();
  const metadata = useResidentMetadata("US_CO");

  return new UsCoCreditReportPresenter(resident, metadata);
}

export const UsCoSingleMonthCreditReport = withPresenterManager({
  ManagedComponent,
  usePresenter,
  managerIsObserver: true,
});
