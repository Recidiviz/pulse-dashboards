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

import { formatDistanceToNowStrict } from "date-fns";
import { observer } from "mobx-react-lite";

import {
  Card,
  CardHeading,
  CardValue,
  HomepageSectionHeading,
  SlateCopy,
  TwoColumnCardWrapper,
} from "~@jii/common-ui";
import { formatFullDate, useSingleResidentContext } from "~@jii/data";
import { withPresenterManager } from "~hydration-utils";

import { UsAzImportantDatesPresenter } from "./UsAzImportantDatesPresenter";

const DateInfoCard = ({
  title,
  date,
}: {
  title: string;
  date: string | undefined;
}) => {
  if (!date) {
    return (
      <Card>
        <CardHeading>{title}</CardHeading>
        <CardValue>None on record</CardValue>
      </Card>
    );
  }

  const dateObj = new Date(date);

  return (
    <Card>
      <CardHeading>{title}</CardHeading>
      <CardValue>{formatFullDate(dateObj)}</CardValue>
      <SlateCopy>{`(${formatDistanceToNowStrict(dateObj)} from today)`}</SlateCopy>
    </Card>
  );
};

const ManagedComponent: React.FC<{ presenter: UsAzImportantDatesPresenter }> =
  observer(function UsAzImportantDates({ presenter }) {
    const { csbdDate, ercdDate, sedDate, csedDate } = presenter.metadata;

    return (
      <div>
        <section>
          <HomepageSectionHeading>
            My Important Dates to Keep Track of
          </HomepageSectionHeading>
          <TwoColumnCardWrapper>
            <DateInfoCard title="TR Date (CSBD)" date={csbdDate} />
            <DateInfoCard title="85% Date (ERCD)" date={ercdDate} />
            <DateInfoCard
              title="100% Date (Flat Sentence, SED)"
              date={sedDate}
            />
            <DateInfoCard title="115% Date (CSED)" date={csedDate} />
          </TwoColumnCardWrapper>
        </section>
      </div>
    );
  });

function usePresenter() {
  const { resident } = useSingleResidentContext();

  return new UsAzImportantDatesPresenter(resident);
}

export const UsAzImportantDates = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
