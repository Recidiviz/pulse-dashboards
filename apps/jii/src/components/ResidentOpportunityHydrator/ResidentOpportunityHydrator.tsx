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
import { FC, memo } from "react";
import { Outlet } from "react-router-dom";

import { PageHydrator } from "../PageHydrator/PageHydrator";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { ResidentOpportunityContext } from "./context";
import { ResidentOpportunityHydratorPresenter } from "./ResidentOpportunityHydratorPresenter";

const ResidentOpportunityHydratorWithPresenter: FC<{
  presenter: ResidentOpportunityHydratorPresenter;
}> = observer(function ResidentOpportunityHydratorWithPresenter({ presenter }) {
  const {
    activeResident,
    eligibilityReport,
    opportunityConfig,
    opportunityId,
  } = presenter;

  return (
    <Outlet
      context={
        {
          ...useResidentsContext(),
          activeResident,
          eligibilityReport,
          opportunityConfig,
          opportunityId,
        } satisfies ResidentOpportunityContext
      }
    />
  );
});

export const ResidentOpportunityHydrator: FC<{
  opportunitySlug: string;
}> = memo(function ResidentOpportunityHydrator({ opportunitySlug }) {
  const { residentsStore, activeResident } = useResidentsContext();

  if (!activeResident) {
    throw new Error("Missing resident data");
  }

  const presenter = new ResidentOpportunityHydratorPresenter(
    opportunitySlug,
    residentsStore,
    activeResident,
  );

  return (
    <PageHydrator hydratable={presenter}>
      <ResidentOpportunityHydratorWithPresenter presenter={presenter} />
    </PageHydrator>
  );
});
