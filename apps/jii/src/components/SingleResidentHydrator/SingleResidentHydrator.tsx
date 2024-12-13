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
import { useResidentsContext } from "../ResidentsHydrator/context";
import { SingleResidentContextProvider } from "./context";
import { SingleResidentHydratorPresenter } from "./SingleResidentHydratorPresenter";

// isolating data access in its own component prevents it from throwing errors before hydration is complete
const SingleResidentHydratorWithPresenter: FC<{
  presenter: SingleResidentHydratorPresenter;
}> = observer(function SingleResidentHydratorWithPresenter({ presenter }) {
  return (
    <SingleResidentContextProvider value={presenter.residentData}>
      <Outlet />
    </SingleResidentContextProvider>
  );
});

export const SingleResidentHydrator = memo(function SingleResidentHydrator() {
  const { personPseudoId } = useTypedParams(State.Resident);
  const { residentsStore } = useResidentsContext();

  const presenter = new SingleResidentHydratorPresenter(
    residentsStore,
    personPseudoId,
  );

  return (
    <PageHydrator hydratable={presenter}>
      <SingleResidentHydratorWithPresenter presenter={presenter} />
    </PageHydrator>
  );
});
