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
import { useUsAzTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { useUsAzSingleResidentContext } from "../UsAzSingleResidentContext/UsAzSingleResidentContext";
import { DateInfoCard } from "./DateInfoCard";
import { DPRBanner } from "./DPRBanner";
import { MissingDateCard } from "./MissingDateCard";
import { SectionSubHeader } from "./styles";
import { UsAzImportantDatesPresenter } from "./UsAzImportantDatesPresenter";

const ManagedComponent: React.FC<{ presenter: UsAzImportantDatesPresenter }> =
  observer(function UsAzImportantDates({ presenter }) {
    const { t } = useUsAzTranslations();
    const { isDprQualified } = useUsAzSingleResidentContext();

    return (
      <div>
        <section>
          {isDprQualified && <DPRBanner />}

          <HomepageSectionHeading>
            {t(($) => $.importantDates.sectionHeader)}
          </HomepageSectionHeading>
          <SectionSubHeader>
            {t(($) => $.importantDates.sectionSubHeader)}
          </SectionSubHeader>
          {presenter.hasNoDates ? (
            <MissingDateCard dateKey="sedDate" />
          ) : (
            presenter.dateEntries.map((entry) => {
              const dateKey = entry.dateKey;

              return (
                <DateInfoCard
                  {...entry}
                  key={dateKey}
                  title={t(($) => $.importantDates.dates[dateKey].title)}
                  shortName={t(
                    ($) => $.importantDates.dates[dateKey].shortName,
                  )}
                />
              );
            })
          )}
        </section>
      </div>
    );
  });

function usePresenter() {
  const { activeDates } = useUsAzSingleResidentContext();
  const { t } = useUsAzTranslations();

  return new UsAzImportantDatesPresenter(activeDates, t);
}

export const UsAzImportantDates = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
