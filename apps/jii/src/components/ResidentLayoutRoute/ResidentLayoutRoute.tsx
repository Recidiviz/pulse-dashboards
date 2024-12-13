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
import { Outlet } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "../../routes/routes";
import { PageLayout } from "../PageLayout/PageLayout";
import { useResidentsContext } from "../ResidentsHydrator/context";
import { NavigationMenu } from "./NavigationMenu";
import { NavigationMenuPresenter } from "./NavigationMenuPresenter";

/**
 * Page layout that renders nested routes with resident navigation in header bar
 */
export const ResidentLayoutRoute = observer(function ResidentLayoutRoute() {
  const { residentsStore, activeResident } = useResidentsContext();
  const residentParams = useTypedParams(State.Resident);
  const navPresenter = new NavigationMenuPresenter(
    residentsStore.config,
    residentsStore.userStore,
    residentParams,
    activeResident,
  );

  return (
    <PageLayout
      header={<NavigationMenu presenter={navPresenter} />}
      main={<Outlet />}
    />
  );
});
