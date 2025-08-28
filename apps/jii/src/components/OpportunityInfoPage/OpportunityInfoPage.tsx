// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { PageLinksFooter } from "~@jii/common-ui";
import { withPresenterManager } from "~hydration-utils";

import { State } from "../../routes/routes";
import { HeaderPortal } from "../AppLayout/HeaderPortal";
import { InfoPage } from "../InfoPage/InfoPage";
import { useResidentOpportunityContext } from "../ResidentOpportunityHydrator/context";
import { BreadcrumbsNav } from "./BreadcrumbsNav";
import { OpportunityInfoPagePresenter } from "./OpportunityInfoPagePresenter";

const ManagedComponent: FC<{
  presenter: OpportunityInfoPagePresenter;
}> = observer(function OpportunityInfoPage({ presenter }) {
  return (
    <>
      <HeaderPortal>
        <BreadcrumbsNav />
      </HeaderPortal>
      <InfoPage heading={presenter.heading} body={presenter.body} />
      {presenter.pageLinks.length > 0 && (
        <PageLinksFooter contents={presenter} />
      )}
    </>
  );
});

function usePresenter() {
  const { pageSlug } = useTypedParams(
    State.Resident.Eligibility.Opportunity.InfoPage,
  );
  const {
    opportunity: { opportunityConfig, eligibilityReport },
  } = useResidentOpportunityContext();

  return new OpportunityInfoPagePresenter(
    opportunityConfig,
    pageSlug,
    eligibilityReport,
  );
}

export const OpportunityInfoPage = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
});
