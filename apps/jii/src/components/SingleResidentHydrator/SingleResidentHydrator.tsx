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
import { Outlet } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { withPresenterManager } from "~hydration-utils";

import { State } from "../../routes/routes";
import { MainContentHydrator } from "../PageHydrator/MainContentHydrator";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { SingleResidentContextProvider } from "./context";
import { SingleResidentHydratorPresenter } from "./SingleResidentHydratorPresenter";

// isolating data access in its own component prevents it from throwing errors before hydration is complete
const ManagedComponent: FC<{
  presenter: SingleResidentHydratorPresenter;
}> = observer(function SingleResidentHydrator({ presenter }) {
  return (
    <SingleResidentContextProvider value={presenter.residentData}>
      <Outlet />
    </SingleResidentContextProvider>
  );
});

function usePresenter() {
  const { personPseudoId } = useTypedParams(State.Resident);
  const { residentsStore } = useResidentsContext();

  return new SingleResidentHydratorPresenter(residentsStore, personPseudoId);
}

export const SingleResidentHydrator = withPresenterManager({
  usePresenter,
  managerIsObserver: false,
  ManagedComponent,
  HydratorComponent: MainContentHydrator,
});
