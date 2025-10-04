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

import { HomepageSectionHeading, SlateCopy } from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { withPresenterManager } from "~hydration-utils";

import { usAzCopy } from "../../configs/copy";
import { DateInfoCard } from "./DateInfoCard";
import { UsAzImportantDatesPresenter } from "./UsAzImportantDatesPresenter";

const { sectionHeader, sectionSubHeader } = usAzCopy.importantDates;

const ManagedComponent: React.FC<{ presenter: UsAzImportantDatesPresenter }> =
  observer(function UsAzImportantDates({ presenter }) {
    return (
      <div>
        <section>
          <HomepageSectionHeading>{sectionHeader}</HomepageSectionHeading>
          <SlateCopy as="p">{sectionSubHeader}</SlateCopy>
          {presenter.dateEntries.map(({ key, date, config, isHighlighted }) => {
            return (
              <DateInfoCard
                key={key}
                title={config.title}
                date={date}
                info={config.info}
                dateKey={key}
                shortName={config.shortName}
                isHighlighted={isHighlighted}
              />
            );
          })}
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
