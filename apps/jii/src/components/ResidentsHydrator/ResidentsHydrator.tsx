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
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "../../routes/routes";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { useRootStore } from "../StoreProvider/useRootStore";
import { ResidentsContext } from "./context";
import { ResidentsHydratorPresenter } from "./ResidentsHydratorPresenter";

const ResidentsHydratorWithPresenter: FC<{
  presenter: ResidentsHydratorPresenter;
}> = observer(function ResidentsHydratorWithPresenter({ presenter }) {
  const { residentsStore, activeResident } = presenter;
  return (
    <Outlet
      context={{ residentsStore, activeResident } satisfies ResidentsContext}
    />
  );
});

export const ResidentsHydrator: FC = memo(function ResidentsHydrator() {
  const { personPseudoId } = useTypedParams(State.Eligibility);
  const presenter = new ResidentsHydratorPresenter(
    useRootStore(),
    personPseudoId,
  );
  return (
    <PageHydrator hydratable={presenter}>
      <ResidentsHydratorWithPresenter presenter={presenter} />
    </PageHydrator>
  );
});