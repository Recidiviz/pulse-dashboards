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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components";

import {
  Card,
  CardHeading,
  CardValue,
  GoLink,
  HomepageSectionHeading,
} from "~@jii/common-ui";
import { useResidentMetadata, useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsCoTranslations } from "~@jii/translation";
import { spacing } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import {
  UsCoCreditReportPresenter,
  UsCoMonthlyReport,
} from "../../../presenters/UsCoCreditReportPresenter";

const MonthlyReportSummaryGridWrapper = styled.div`
  display: grid;
  gap: ${rem(spacing.sm)};
  grid-template-columns: 1fr 1fr 1fr 1fr;
  margin-bottom: ${rem(spacing.md)};
`;

const MonthlyReportSummaryCard = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0;
  height: 9.5rem;
  text-align: center;
`;

const LinkContainer = styled.div`
  margin-top: ${rem(spacing.lg)};
  margin-bottom: ${rem(spacing.lg)};
  width: 100%;
  display: flex;
  justify-content: center;
`;

const MonthlyReportSummary = ({ report }: { report: UsCoMonthlyReport }) => {
  const { t } = useUsCoTranslations();
  const { totalCredits, date } = report;
  return (
    <Link
      to={State.Resident.$.EGT.MonthlyReport.buildRelativePath({
        reportDate: report.monthSlug,
      })}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <MonthlyReportSummaryCard>
        <CardValue>
          {t(($) => $.monthlyReport.creditCount, { count: totalCredits })}
        </CardValue>
        <CardHeading>
          {t(($) => $.monthlyReport.monthLabel, { date })}
        </CardHeading>
      </MonthlyReportSummaryCard>
    </Link>
  );
};

const ManagedComponent = observer(function UsCoMonthlyReports({
  presenter,
}: {
  presenter: UsCoCreditReportPresenter;
}) {
  const { t } = useUsCoTranslations();

  const { mostRecentReports } = presenter;

  // nothing to show until the resident has some credit activity on record
  if (mostRecentReports.length === 0) return null;

  return (
    <section>
      <HomepageSectionHeading>
        {t(($) => $.monthlyReport.summary.sectionHeader)}
      </HomepageSectionHeading>
      <MonthlyReportSummaryGridWrapper>
        {mostRecentReports.map((report) => (
          <MonthlyReportSummary report={report} key={report.monthSlug} />
        ))}
      </MonthlyReportSummaryGridWrapper>
      <LinkContainer>
        <GoLink to={State.Resident.$.EGT.AllMonths.buildRelativePath({})}>
          {t(($) => $.monthlyReport.summary.seeFullList)}
        </GoLink>
      </LinkContainer>
    </section>
  );
});

function usePresenter() {
  const { resident } = useSingleResidentContext();
  const metadata = useResidentMetadata("US_CO");

  return new UsCoCreditReportPresenter(resident, metadata);
}

export const UsCoMonthlyReports = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
