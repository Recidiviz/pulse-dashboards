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
import { useUsAzTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { DateInfoCard } from "./DateInfoCard";
import {
  UsAzDateField,
  UsAzImportantDatesPresenter,
} from "./UsAzImportantDatesPresenter";

const ManagedComponent: React.FC<{ presenter: UsAzImportantDatesPresenter }> =
  observer(function UsAzImportantDates({ presenter }) {
    const { t } = useUsAzTranslations();

    return (
      <div>
        <section>
          <HomepageSectionHeading>
            {t(($) => $.importantDates.sectionHeader)}
          </HomepageSectionHeading>
          <SlateCopy as="p">
            {t(($) => $.importantDates.sectionSubHeader)}
          </SlateCopy>
          {presenter.dateEntries.map(({ key, date, isHighlighted }) => {
            const dateKey = key as UsAzDateField;

            return (
              <DateInfoCard
                key={key}
                title={t(($) => $.importantDates.dates[dateKey].title)}
                date={date}
                info={t(($) => $.importantDates.dates[dateKey].info)}
                dateKey={dateKey}
                shortName={t(($) => $.importantDates.dates[dateKey].shortName)}
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
