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

import { HomepageSectionHeading } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { useUsAzTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { DateInfoCard } from "./DateInfoCard";
import { DPRBanner } from "./DPRBanner";
import { MissingDateCard } from "./MissingDateCard";
import { SectionSubHeader } from "./styles";
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
          {presenter.metadata.isDprEligible && <DPRBanner />}

          <HomepageSectionHeading>
            {t(($) => $.importantDates.sectionHeader)}
          </HomepageSectionHeading>
          <SectionSubHeader>
            {t(($) => $.importantDates.sectionSubHeader)}
          </SectionSubHeader>
          {presenter.hasNoDates ? (
            <MissingDateCard dateKey="sedDateRaw" />
          ) : (
            presenter.dateEntries.map(
              ({ key, date, isUpcoming, infoPageHash }) => {
                const dateKey = key as UsAzDateField;

                return (
                  <DateInfoCard
                    key={key}
                    title={t(($) => $.importantDates.dates[dateKey].title)}
                    date={date}
                    info={t(($) => $.importantDates.dates[dateKey].info)}
                    infoTag={t(($) => $.importantDates.dates[dateKey].infoTag)}
                    dateKey={dateKey}
                    shortName={t(
                      ($) => $.importantDates.dates[dateKey].shortName,
                    )}
                    isUpcoming={isUpcoming}
                    infoPageHash={infoPageHash}
                  />
                );
              },
            )
          )}
        </section>
      </div>
    );
  });

function usePresenter() {
  const metadata = useResidentMetadata("US_AZ");

  return new UsAzImportantDatesPresenter(metadata);
}

export const UsAzImportantDates = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
