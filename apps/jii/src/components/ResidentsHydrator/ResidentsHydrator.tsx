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

import { withPresenterManager } from "~hydration-utils";

import { PageHydrator } from "../PageHydrator/PageHydrator";
import { useRootStore } from "../StoreProvider/useRootStore";
import { ResidentsContextProvider } from "./context";
import { ResidentsHydratorPresenter } from "./ResidentsHydratorPresenter";

const ManagedComponent: FC<{
  presenter: ResidentsHydratorPresenter;
}> = observer(function ResidentsHydrator({ presenter }) {
  const { residentsStore } = presenter;
  return (
    <ResidentsContextProvider value={{ residentsStore }}>
      <Outlet />
    </ResidentsContextProvider>
  );
});

function usePresenter() {
  return new ResidentsHydratorPresenter(useRootStore());
}

export const ResidentsHydrator = withPresenterManager({
  usePresenter,
  managerIsObserver: false,
  ManagedComponent,
  HydratorComponent: PageHydrator,
});
