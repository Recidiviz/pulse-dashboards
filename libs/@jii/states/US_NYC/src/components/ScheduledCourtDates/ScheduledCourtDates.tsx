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

import { useResidentMetadata } from "~@jii/data";
import { SentenceDates } from "~@jii/sentence-dates";
import { useUsNycTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { CardsWrapperOverride } from "./CardsWrapperOverride";
import { HiddenDatesCardOverride } from "./HiddenDatesCardOverride";
import { ScheduledCourtDatesPresenter } from "./ScheduledCourtDatesPresenter";

const ManagedComponent: React.FC<{ presenter: ScheduledCourtDatesPresenter }> =
  observer(function ManagedComponent({ presenter }) {
    if (!presenter.hasDockets) return null;

    return (
      <SentenceDates
        data={presenter.scheduledCourtDatesData}
        stateCode="US_NYC"
        copyKey="scheduledCourtDates"
        componentOverrides={{
          CardsWrapper: CardsWrapperOverride,
          HiddenDatesCard: HiddenDatesCardOverride,
        }}
        showToggle
        dateLabels={presenter.dateIdOverride}
        alwaysStartHidden
      />
    );
  });

function usePresenter() {
  const stateSpecificData = useResidentMetadata("US_NYC");
  const { t } = useUsNycTranslations();

  return new ScheduledCourtDatesPresenter(stateSpecificData, t);
}

export const ScheduledCourtDates = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
