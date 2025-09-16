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

import { observer } from "mobx-react-lite";

import {
  Card,
  CardHeading,
  CardValue,
  Chip,
  HomepageSectionHeading,
  TwoColumnCardWrapper,
} from "~@jii/common-ui";
import { formatFullDate, useSingleResidentContext } from "~@jii/data";
import { OpenTable } from "~@jii/earned-good-time";
import { UsTnCreditActivity } from "~datatypes";
import { withPresenterManager } from "~hydration-utils";

import { usTnCopy } from "../../configs/copy";
import { UsTnMonthlyReportSelector } from "./UsTnMonthlyReportSelector";
import { UsTnMonthlyReportsPresenter } from "./UsTnMonthlyReportsPresenter";

const StatusChip: React.FC<{ status: "GAIN" | "LOSS" }> = ({ status }) => {
  const { reportTags } = usTnCopy.monthlyCreditReport;

  const color = status === "GAIN" ? "green" : "gray";

  return <Chip color={color}>{reportTags[status]}</Chip>;
};

const ManagedComponent = observer(function UsTnMonthlyReports({
  presenter,
}: {
  presenter: UsTnMonthlyReportsPresenter;
}) {
  const {
    selectedMonthlyReport: {
      behaviorCredits,
      programCredits,
      educationCredits,
      treatmentCredits,
      totalCredits,
      reports,
    },
  } = presenter;

  const {
    creditCategories,
    sectionHeader,
    reportColumns,
    noMonthlyReport,
    totalCredits: totalCreditsCopy,
  } = usTnCopy.monthlyCreditReport;

  const filteredReports = reports.filter(
    ({ creditType }) => creditType !== null,
  );

  // TODO(#9283):[JII][TN] Move "X days" into centralized copy
  return (
    <section>
      <HomepageSectionHeading>{sectionHeader}</HomepageSectionHeading>
      <Card>
        <UsTnMonthlyReportSelector presenter={presenter} />
        <TwoColumnCardWrapper>
          <Card>
            <CardHeading>{creditCategories.behavior}</CardHeading>
            <CardValue>{behaviorCredits} days</CardValue>
          </Card>
          <Card>
            <CardHeading>{creditCategories.program}</CardHeading>
            <CardValue>{programCredits} days</CardValue>
          </Card>
          <Card>
            <CardHeading>{creditCategories.education}</CardHeading>
            <CardValue>{educationCredits} days</CardValue>
          </Card>
          <Card>
            <CardHeading>{creditCategories.treatment}</CardHeading>
            <CardValue>{treatmentCredits} days</CardValue>
          </Card>
        </TwoColumnCardWrapper>
        {filteredReports.length === 0 ? (
          noMonthlyReport
        ) : (
          <OpenTable
            columns={[
              { key: "creditType", label: reportColumns.creditType },
              { key: "status", label: reportColumns.status },
              { key: "amount", label: reportColumns.amount },
              { key: "creditDate", label: reportColumns.creditDate },
            ]}
            data={filteredReports
              .map((r) => generateReportRow(r))
              .filter((x) => x !== null)}
            footer={{
              creditType: totalCreditsCopy,
              amount: `${totalCredits > 0 ? "+" : "-"} ${Math.abs(totalCredits)} days`,
            }}
          />
        )}
      </Card>
    </section>
  );
});

function generateReportRow(report: UsTnCreditActivity) {
  const { creditsEarned } = report;
  const { creditTypes: creditTypeCopy, unknownCreditType } =
    usTnCopy.monthlyCreditReport;

  if (creditsEarned === null) return null;

  return {
    creditDate: formatFullDate(report.creditDate),
    creditType: report.creditType
      ? creditTypeCopy[report.creditType]
      : unknownCreditType,
    amount: `${creditsEarned > 0 ? "+" : "-"} ${Math.abs(creditsEarned)} days`,
    status: <StatusChip status={creditsEarned > 0 ? "GAIN" : "LOSS"} />,
  };
}

function usePresenter() {
  const { resident } = useSingleResidentContext();

  return new UsTnMonthlyReportsPresenter(resident);
}

export const UsTnMonthlyReports = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
