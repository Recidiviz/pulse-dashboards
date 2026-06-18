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
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { BottomPaddedContainer, Redirect, usePageTitle } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { LastUpdatedBanner } from "~@jii/layout";
import { State } from "~@jii/paths";
import { ProgramsCtaSection } from "~@jii/program-catalog";
import { SentenceDates } from "~@jii/sentence-dates";
import { useUsCoTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { UsCoMonthlyReports } from "../components/UsCoSingleResidentHome/UsCoMonthlyReports";
import { ResidentHomePresenter } from "../presenters/ResidentHomePresenter";
import { useV1Gate } from "../useV1Gate";
import {
  SentenceDatesPedSupplementalOverride,
  SentenceDatesPedValueOverride,
} from "./SentenceDatesPedOverrides";
import { SentenceDatesSectionWrapperOverride } from "./SentenceDatesSectionWrapperOverride";

const ManagedComponent: React.FC<{ presenter: ResidentHomePresenter }> =
  observer(function UsCoSingleResidentHome({ presenter }) {
    const residentUrlParams = useTypedParams(State.Resident);
    const { t } = useUsCoTranslations();

    usePageTitle(t(($) => $.homepage.pageTitle));

    if (!useV1Gate())
      return (
        <Redirect
          to={State.Resident.ProgramCatalog.buildPath(residentUrlParams)}
        />
      );

    return (
      <BottomPaddedContainer>
        <LastUpdatedBanner
          overrideCopy={t(($) => $.homepage.lastUpdatedDate, {
            lastUpdatedDate: presenter.lastUpdatedDate,
          })}
        />

        <SentenceDates
          data={presenter.sentenceDatesData}
          stateCode="US_CO"
          componentOverrides={{
            SectionWrapper: SentenceDatesSectionWrapperOverride,
            DateValue: SentenceDatesPedValueOverride,
            DateValueSupplemental: SentenceDatesPedSupplementalOverride,
          }}
        />

        <UsCoMonthlyReports />

        <ProgramsCtaSection stateCode="US_CO" />
      </BottomPaddedContainer>
    );
  });

function usePresenter() {
  return new ResidentHomePresenter(useResidentMetadata("US_CO"));
}

export const UsCoSingleResidentHome = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
