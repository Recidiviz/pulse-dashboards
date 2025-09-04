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
import { withPresenterManager } from "~hydration-utils";

import { UsTnMonthlyReportSelector } from "./UsTnMonthlyReportSelector";
import { UsTnMonthlyReportsPresenter } from "./UsTnMonthlyReportsPresenter";

const StatusChip: React.FC<{ status: "GAIN" | "LOSS" }> = ({ status }) => {
  if (status === "GAIN") {
    return <Chip color="green">Earned</Chip>;
  } else {
    return <Chip color="gray">Lost</Chip>;
  }
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

  const filteredReports = reports.filter(
    ({ creditType }) => creditType !== null,
  );

  return (
    <section>
      <HomepageSectionHeading>Recent monthly reports</HomepageSectionHeading>
      <Card>
        <UsTnMonthlyReportSelector presenter={presenter} />
        <TwoColumnCardWrapper>
          <Card>
            <CardHeading>Behavior Credits</CardHeading>
            <CardValue>{behaviorCredits} days</CardValue>
          </Card>
          <Card>
            <CardHeading>Program Credits</CardHeading>
            <CardValue>{programCredits} days</CardValue>
          </Card>
          <Card>
            <CardHeading>Educational Good Time Credits</CardHeading>
            <CardValue>{educationCredits} days</CardValue>
          </Card>
          <Card>
            <CardHeading>Treatment Good Time Credits</CardHeading>
            <CardValue>{treatmentCredits} days</CardValue>
          </Card>
        </TwoColumnCardWrapper>
        {filteredReports.length === 0 ? (
          "No credit activity for this month."
        ) : (
          <OpenTable
            columns={[
              { key: "creditType", label: "Credit Type" },
              { key: "status", label: "Status" },
              { key: "amount", label: "Days" },
              { key: "creditDate", label: "Date" },
            ]}
            data={filteredReports.map(
              ({ creditDate, creditType, creditsEarned }) => ({
                creditDate: formatFullDate(creditDate),
                creditType,
                amount: `+ ${creditsEarned} days`,
                status: <StatusChip status="GAIN" />,
              }),
            )}
            footer={{
              creditType: "Total Credits",
              amount: `+ ${totalCredits} days`,
            }}
          />
        )}
      </Card>
    </section>
  );
});

function usePresenter() {
  const { resident } = useSingleResidentContext();

  return new UsTnMonthlyReportsPresenter(resident);
}

export const UsTnMonthlyReports = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
