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
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import {
  Card,
  CardHeading,
  CardValue,
  GoButton,
  HomepageSectionHeading,
} from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { withPresenterManager } from "~hydration-utils";

import { usTnCopy } from "../../../configs/copy";
import { prefixNumberWithSign } from "../../../utils";
import {
  useUsTnSingleResidentDataContext,
  UsTnMonthlyReport,
} from "../../UsTnSingleResidentDataContext/context";
import { UsTnMonthlyReportsPresenter } from "./UsTnMonthlyReportsPresenter";

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
`;

const MonthlyReportSummary = ({ report }: { report: UsTnMonthlyReport }) => {
  const { totalCredits, formattedMonth } = report;
  return (
    <Link
      to={State.Resident.$.EGT.MonthlyReport.buildRelativePath({
        reportDate: report.monthSlug,
      })}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <MonthlyReportSummaryCard>
        <CardValue>{prefixNumberWithSign(totalCredits)}</CardValue>
        <CardHeading>{formattedMonth}</CardHeading>
      </MonthlyReportSummaryCard>
    </Link>
  );
};

const ManagedComponent = observer(function UsTnMonthlyReports({
  presenter,
}: {
  presenter: UsTnMonthlyReportsPresenter;
}) {
  const { sectionHeader } = usTnCopy.monthlyCreditReportSummary;

  const { mostRecentReports } = presenter;

  // TODO(#9283):[JII][TN] Move "X days" into centralized copy
  return (
    <section>
      <HomepageSectionHeading>{sectionHeader}</HomepageSectionHeading>
      <MonthlyReportSummaryGridWrapper>
        {mostRecentReports.map((report) => (
          <MonthlyReportSummary report={report} key={report.monthSlug} />
        ))}
      </MonthlyReportSummaryGridWrapper>
      <GoButton
        to={State.Resident.$.UsTnMoreInformation.Credits.buildRelativePath({})}
      >
        Learn More
      </GoButton>
    </section>
  );
});

function usePresenter() {
  const { resident } = useSingleResidentContext();
  const { monthlyReports } = useUsTnSingleResidentDataContext();

  return new UsTnMonthlyReportsPresenter(resident, monthlyReports);
}

export const UsTnMonthlyReports = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
