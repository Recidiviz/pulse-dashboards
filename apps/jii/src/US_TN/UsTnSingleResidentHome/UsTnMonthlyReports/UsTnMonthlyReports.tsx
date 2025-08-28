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
  TwoColumnCardWrapper,
} from "~@jii/common-ui";
import { withPresenterManager } from "~hydration-utils";

import { useSingleResidentContext } from "../../../components/SingleResidentHydrator/context";
import { HomepageSectionHeading } from "../../../US_MA/earnedGoodTime/components/Homepage/styles";
import { UsTnMonthlyReportSelector } from "./UsTnMonthlyReportSelector";
import { UsTnMonthlyReportsPresenter } from "./UsTnMonthlyReportsPresenter";

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
    },
  } = presenter;
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
