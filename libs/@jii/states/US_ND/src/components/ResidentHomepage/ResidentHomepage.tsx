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
import { FC } from "react";

import { BottomPaddedContainer, usePageTitle } from "~@jii/common-ui";
import { useResidentMetadata, useSingleResidentContext } from "~@jii/data";
import { LastUpdatedBanner } from "~@jii/layout";
import { SentenceDates } from "~@jii/sentence-dates";
import { useUsNdTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { DateDescriptionOverride } from "../SentenceDatesOverrides/DateDescription";
import { DateValueOverride } from "../SentenceDatesOverrides/DateValue";
import { DateValueSupplementalOverride } from "../SentenceDatesOverrides/DateValueSupplemental";
import { SectionWrapperOverride } from "../SentenceDatesOverrides/SectionWrapper";
import { DataValidationBanner } from "./DataValidationBanner";
import { OSUBanner } from "./OSUBanner";
import { ResidentHomepagePresenter } from "./ResidentHomepagePresenter";

const ManagedComponent: FC<{ presenter: ResidentHomepagePresenter }> = observer(
  function ResidentHomepage({ presenter }) {
    const { t } = useUsNdTranslations();
    usePageTitle(t(($) => $.sentenceDates.general.heading));

    return (
      <BottomPaddedContainer>
        <LastUpdatedBanner lastUpdatedDate={presenter.lastUpdatedDate} />
        {presenter.isOSUResident && <OSUBanner />}
        <DataValidationBanner />
        <SentenceDates
          data={presenter.sentenceDatesData}
          stateCode="US_ND"
          componentOverrides={{
            SectionWrapper: SectionWrapperOverride,
            DateValue: DateValueOverride,
            DateValueSupplemental: DateValueSupplementalOverride,
            DateDescription: DateDescriptionOverride,
          }}
        />
      </BottomPaddedContainer>
    );
  },
);

function usePresenter() {
  const { resident } = useSingleResidentContext();
  return new ResidentHomepagePresenter(useResidentMetadata("US_ND"), resident);
}

export const ResidentHomepage = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
